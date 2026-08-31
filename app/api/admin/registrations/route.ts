import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { assertSubjectAvailable, assertSubjectQuotaAvailable, InvalidSubjectError, RegistrationQuotaError } from "@/lib/registrationQuota";
import { isValidChineseIdNumber, parseChineseIdNumber } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const classId = request.nextUrl.searchParams.get("classId") || undefined;
  const subject = request.nextUrl.searchParams.get("subject") || undefined;
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const registrations = await prisma.registration.findMany({
    where: { classId, subject, status: status as never },
    include: { class: true, user: true },
    orderBy: [{ class: { name: "asc" } }, { createdAt: "desc" }]
  });
  return jsonOk(registrations);
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const id = String(body.id || "");
  const action = String(body.action || "");
  if (action === "review") {
    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [id];
    const ids = rawIds.map((item) => String(item || "")).filter(Boolean);
    const reviewStatus = String(body.reviewStatus || "");
    const allowedStatuses = new Set(["PENDING", "APPROVED", "REJECTED"]);
    if (ids.length === 0) return jsonError("请选择需要审核的考生");
    if (!allowedStatuses.has(reviewStatus)) return jsonError("审核状态不正确");

    const reason = String(body.reviewReason || "").trim();
    if (reviewStatus === "REJECTED" && !reason) return jsonError("审核不通过时必须填写不通过原因");

    const result = await prisma.registration.updateMany({
      where: { id: { in: ids }, status: "SUBMITTED" },
      data: {
        reviewStatus: reviewStatus as never,
        reviewReason: reviewStatus === "REJECTED" ? reason : null,
        reviewedAt: reviewStatus === "PENDING" ? null : new Date()
      }
    });
    if (result.count === 0) return jsonError("没有可审核的已提交考生");
    return jsonOk({ count: result.count });
  }

  if (action === "payment") {
    const rawIds: unknown[] = Array.isArray(body.ids) ? body.ids : [id];
    const ids = rawIds.map((item) => String(item || "")).filter(Boolean);
    const paymentStatus = String(body.paymentStatus || "");
    if (ids.length === 0) return jsonError("请选择需要操作的考生");
    if (!["UNPAID", "PAID"].includes(paymentStatus)) return jsonError("缴费状态不正确");
    const result = await prisma.registration.updateMany({
      where: { id: { in: ids } },
      data: {
        paymentStatus: paymentStatus as never,
        paymentPaidAt: paymentStatus === "PAID" ? new Date() : null,
        paymentRemark: paymentStatus === "PAID" ? "管理员手动标记已缴费" : null
      }
    });
    if (result.count === 0) return jsonError("没有找到可更新的考生");
    return jsonOk({ count: result.count });
  }

  const registration = await prisma.registration.findUnique({ where: { id }, include: { user: true } });
  if (!registration) return jsonError("报名记录不存在", 404);
  if (action === "set-class-admin") {
    const classId = String(body.classId || registration.classId || "");
    if (!classId) return jsonError("请选择班级");
    await prisma.user.update({ where: { id: registration.userId }, data: { role: "CLASS_ADMIN", classId } });
    return jsonOk({});
  }
  if (action === "unset-class-admin") {
    await prisma.user.update({ where: { id: registration.userId }, data: { role: "STUDENT" } });
    return jsonOk({});
  }
  if (action === "update-info") {
    const idNumber = String(body.idNumber || registration.idNumber).trim().toUpperCase();
    if (!isValidChineseIdNumber(idNumber)) return jsonError("身份证号不合法");
    const parsedId = parseChineseIdNumber(idNumber);
    const classId = String(body.classId || "").trim() || null;
    const subject = String(body.subject || "").trim() || null;
    try {
      await prisma.$transaction(async (tx) => {
        if (subject) {
          await assertSubjectAvailable(tx, subject);
        }
        if (registration.status === "SUBMITTED") {
          await assertSubjectQuotaAvailable(tx, subject, id);
        }
        await tx.registration.update({
          where: { id },
          data: {
            idNumber,
            name: String(body.name || "").trim() || null,
            studentNumber: String(body.studentNumber || "").trim() || null,
            classId,
            gender: parsedId.gender,
            birthDate: parsedId.birthDate,
            phone: String(body.phone || "").trim() || null,
            address: String(body.address || "").trim() || null,
            subject
          }
        });
        await tx.user.update({ where: { id: registration.userId }, data: { username: idNumber, classId } });
      });
    } catch (error) {
      if (error instanceof RegistrationQuotaError) return jsonError(error.message, 409);
      if (error instanceof InvalidSubjectError) return jsonError(error.message, 400);
      throw error;
    }
    return jsonOk({});
  }
  return jsonError("未知操作");
}

export async function DELETE(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const id = request.nextUrl.searchParams.get("id") || "";
  const registration = await prisma.registration.findUnique({ where: { id }, include: { user: true } });
  if (!registration) return jsonError("报名记录不存在", 404);
  if (registration.user.role === "SYSTEM_ADMIN") return jsonError("不能删除系统管理员账号", 400);

  await prisma.user.delete({ where: { id: registration.userId } });

  if (registration.photoPath) {
    const photosDir = path.resolve(process.cwd(), "storage", "photos");
    const photoPath = path.resolve(process.cwd(), registration.photoPath);
    if (photoPath === photosDir || photoPath.startsWith(`${photosDir}${path.sep}`)) {
      await fs.unlink(photoPath).catch(() => {});
    }
  }

  return jsonOk({});
}
