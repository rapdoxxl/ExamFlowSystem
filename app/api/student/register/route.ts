import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data";
import { jsonError, jsonOk } from "@/lib/response";
import { draftRegistrationSchema, parseChineseIdNumber, submittedRegistrationSchema } from "@/lib/validation";
import { generateQueryPassword, hashPassword, verifyPassword } from "@/lib/password";
import { validateAndSavePhoto } from "@/lib/upload/photo";
import { getCurrentUser, setSession } from "@/lib/auth";
import { assertSubjectQuotaAvailable, RegistrationQuotaError } from "@/lib/registrationQuota";

export async function POST(request: NextRequest) {
  const settings = await getSettings();
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "draft");
  if (!settings.registrationOpen) return jsonError("报名入口已关闭，只能查询，不能新增或修改", 403);

  const raw = {
    idNumber: String(formData.get("idNumber") || ""),
    queryPassword: String(formData.get("queryPassword") || ""),
    name: String(formData.get("name") || ""),
    studentNumber: String(formData.get("studentNumber") || ""),
    classId: String(formData.get("classId") || ""),
    phone: String(formData.get("phone") || ""),
    address: String(formData.get("address") || ""),
    subject: String(formData.get("subject") || "")
  };

  const schema = intent === "submit" ? submittedRegistrationSchema : draftRegistrationSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "报名信息不完整");

  const idNumber = parsed.data.idNumber;
  const currentUser = await getCurrentUser();
  const existing = await prisma.registration.findUnique({ where: { idNumber }, include: { user: true } });
  const sessionMatches = Boolean(currentUser?.registration?.id === existing?.id);
  if (existing && !sessionMatches && !raw.queryPassword) return jsonError("该身份证号已登记，请使用查询密码进入后修改", 409);
  if (existing && !sessionMatches && !(await verifyPassword(raw.queryPassword, existing.queryPasswordHash))) return jsonError("查询密码不正确", 403);

  const subject = parsed.data.subject ?? existing?.subject ?? null;
  if (intent === "submit") {
    try {
      await assertSubjectQuotaAvailable(prisma, subject, existing?.id);
    } catch (error) {
      if (error instanceof RegistrationQuotaError) return jsonError(error.message, 409);
      throw error;
    }
  }

  const idInfo = parseChineseIdNumber(idNumber);
  const file = formData.get("photo");
  let photoPath = existing?.photoPath || null;
  if (file instanceof File && file.size > 0) {
    try {
      photoPath = await validateAndSavePhoto(file, idNumber);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "照片校验失败");
    }
  }
  if (intent === "submit" && !photoPath) return jsonError("正式提交前必须上传符合要求的电子照片");

  const queryPassword = existing ? "" : generateQueryPassword();
  const queryPasswordHash = existing?.queryPasswordHash || (await hashPassword(queryPassword));
  const classId = parsed.data.classId || existing?.classId || null;

  let registration;
  try {
    registration = await prisma.$transaction(async (tx) => {
      if (intent === "submit") {
        await assertSubjectQuotaAvailable(tx, subject, existing?.id);
      }

      if (existing) {
        const updated = await tx.registration.update({
          where: { id: existing.id },
          data: {
            name: parsed.data.name ?? existing.name,
            studentNumber: parsed.data.studentNumber ?? existing.studentNumber,
            classId,
            gender: idInfo.gender,
            birthDate: idInfo.birthDate,
            phone: parsed.data.phone ?? existing.phone,
            address: parsed.data.address ?? existing.address,
            subject,
            photoPath,
            status: intent === "submit" ? "SUBMITTED" : existing.status,
            reviewStatus: intent === "submit" ? "PENDING" : existing.reviewStatus,
            reviewReason: intent === "submit" ? null : existing.reviewReason,
            reviewedAt: intent === "submit" ? null : existing.reviewedAt,
            submittedAt: intent === "submit" ? new Date() : existing.submittedAt
          }
        });
        await tx.user.update({ where: { id: existing.userId }, data: { classId } });
        return updated;
      }

      const user = await tx.user.create({ data: { username: idNumber, role: "STUDENT", classId } });
      return tx.registration.create({
        data: {
          userId: user.id,
          idNumber,
          queryPasswordHash,
          name: parsed.data.name || null,
          studentNumber: parsed.data.studentNumber || null,
          classId,
          gender: idInfo.gender,
          birthDate: idInfo.birthDate,
          phone: parsed.data.phone || null,
          address: parsed.data.address || null,
          subject,
          photoPath,
          status: intent === "submit" ? "SUBMITTED" : "DRAFT",
          reviewStatus: "PENDING",
          submittedAt: intent === "submit" ? new Date() : null
        }
      });
    });
  } catch (error) {
    if (error instanceof RegistrationQuotaError) return jsonError(error.message, 409);
    throw error;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: registration.userId } });
  await setSession(user.id, user.role);

  return jsonOk({
    id: registration.id,
    status: registration.status,
    reviewStatus: registration.reviewStatus,
    queryPassword: existing ? undefined : queryPassword,
    message: intent === "submit" ? "报名信息已提交，待审核" : "草稿已保存"
  });
}
