import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { normalizeSubjectInput } from "@/lib/subjects";

function isPrismaUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function nextSortOrder() {
  const last = await prisma.subject.findFirst({ orderBy: { sortOrder: "desc" } });
  return (last?.sortOrder || 0) + 1;
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const data = normalizeSubjectInput(body);
  if (data.name.length < 2 || data.name.length > 100) return jsonError("科目名称长度应为 2-100 个字符");
  if (data.capacity < 1) return jsonError("科目容量必须为大于 0 的整数");

  try {
    const subject = await prisma.subject.create({
      data: {
        ...data,
        enabled: true,
        sortOrder: data.sortOrder || await nextSortOrder()
      }
    });
    if (subject.quotaGroup) {
      await prisma.subject.updateMany({
        where: { quotaGroup: subject.quotaGroup },
        data: { capacity: subject.capacity, quotaGroupName: subject.quotaGroupName }
      });
    }
    return jsonOk(subject);
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonError("科目名称已存在");
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return jsonError("缺少科目ID");
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) return jsonError("科目不存在", 404);

  const normalized = normalizeSubjectInput({
    capacity: body.capacity ?? existing.capacity,
    name: body.name ?? existing.name,
    quotaGroup: body.quotaGroup ?? existing.quotaGroup,
    quotaGroupName: body.quotaGroupName ?? existing.quotaGroupName,
    sortOrder: body.sortOrder ?? existing.sortOrder
  });
  if (normalized.name.length < 2 || normalized.name.length > 100) return jsonError("科目名称长度应为 2-100 个字符");
  if (normalized.capacity < 1) return jsonError("科目容量必须为大于 0 的整数");
  const enabled = typeof body.enabled === "boolean" ? body.enabled : existing.enabled;

  try {
    const subject = await prisma.$transaction(async (tx) => {
      const updated = await tx.subject.update({
        where: { id },
        data: {
          ...normalized,
          enabled
        }
      });
      if (existing.name !== updated.name) {
        await tx.registration.updateMany({
          where: { subject: existing.name },
          data: { subject: updated.name }
        });
      }
      if (updated.quotaGroup) {
        await tx.subject.updateMany({
          where: { quotaGroup: updated.quotaGroup },
          data: { capacity: updated.capacity, quotaGroupName: updated.quotaGroupName }
        });
      }
      return updated;
    });
    return jsonOk(subject);
  } catch (error) {
    if (isPrismaUniqueError(error)) return jsonError("科目名称已存在");
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!id) return jsonError("缺少科目ID");
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) return jsonError("科目不存在", 404);
  const used = await prisma.registration.count({ where: { subject: subject.name } });
  if (used > 0) {
    const updated = await prisma.subject.update({ where: { id }, data: { enabled: false } });
    return jsonOk({ disabled: true, subject: updated });
  }
  await prisma.subject.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
