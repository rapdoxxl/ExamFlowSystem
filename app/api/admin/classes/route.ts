import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { normalizeClassParts, upsertClass } from "@/lib/classes";

function validateClassParts(parts: { department: string; grade: string; name: string }) {
  if (parts.department.length < 2 || parts.department.length > 80) return "院系名称长度应为 2-80 个字符";
  if (parts.grade.length < 2 || parts.grade.length > 20) return "所在年级长度应为 2-20 个字符";
  if (parts.name.length < 2 || parts.name.length > 80) return "班级名称长度应为 2-80 个字符";
  return "";
}

export async function GET() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const classes = await prisma.class.findMany({
    orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }],
    include: { _count: { select: { registrations: true } } }
  });
  return jsonOk(classes);
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const parts = normalizeClassParts({ department: body.department, grade: body.grade, name: body.name });
  const error = validateClassParts(parts);
  if (error) return jsonError(error);
  const item = await upsertClass(parts);
  return jsonOk(item);
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const id = String(body.id || "");
  const parts = normalizeClassParts({ department: body.department, grade: body.grade, name: body.name });
  if (!id) return jsonError("缺少班级ID");
  const error = validateClassParts(parts);
  if (error) return jsonError(error);
  const item = await prisma.class.update({ where: { id }, data: parts });
  return jsonOk(item);
}

export async function DELETE(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("缺少班级ID");
  const count = await prisma.registration.count({ where: { classId: id } });
  if (count > 0) return jsonError("该班级已有报名数据，不能删除");
  await prisma.class.delete({ where: { id } });
  return jsonOk({});
}
