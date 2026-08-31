import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { assertSubjectAvailable, assertSubjectQuotaAvailable, InvalidSubjectError, RegistrationQuotaError } from "@/lib/registrationQuota";

export async function GET() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user?.classId) return jsonError("无权限", 403);
  const registrations = await prisma.registration.findMany({ where: { classId: user.classId }, include: { class: true }, orderBy: { createdAt: "desc" } });
  return jsonOk(registrations);
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user?.classId) return jsonError("无权限", 403);
  const body = await request.json();
  const id = String(body.id || "");
  const action = String(body.action || "");
  const registration = await prisma.registration.findFirst({ where: { id, classId: user.classId } });
  if (!registration) return jsonError("报名记录不存在", 404);
  if (action === "payment") {
    const paymentStatus = String(body.paymentStatus || "");
    if (!["UNPAID", "PAID"].includes(paymentStatus)) return jsonError("缴费状态不正确");
    await prisma.registration.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus as never,
        paymentPaidAt: paymentStatus === "PAID" ? new Date() : null,
        paymentRemark: paymentStatus === "PAID" ? "班级管理员手动标记已缴费" : null
      }
    });
    return jsonOk({ count: 1 });
  }
  if (action === "update-info") {
    const subject = String(body.subject || "").trim() || registration.subject;
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
            name: String(body.name || "").trim() || registration.name,
            studentNumber: String(body.studentNumber || "").trim() || registration.studentNumber,
            phone: String(body.phone || "").trim() || registration.phone,
            address: String(body.address || "").trim() || registration.address,
            subject
          }
        });
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
