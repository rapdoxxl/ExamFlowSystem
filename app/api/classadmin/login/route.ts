import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { jsonError, jsonOk } from "@/lib/response";
import { idNumberSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const idNumber = idNumberSchema.safeParse(body.idNumber);
  if (!idNumber.success) return jsonError("身份证号不合法");
  const queryPassword = String(body.queryPassword || "").trim();
  const registration = await prisma.registration.findUnique({ where: { idNumber: idNumber.data }, include: { user: true } });
  if (!registration || registration.user.role !== "CLASS_ADMIN" || !(await verifyPassword(queryPassword, registration.queryPasswordHash))) {
    return jsonError("班级管理员账号或密码错误", 403);
  }
  await setSession(registration.userId, registration.user.role);
  return jsonOk({});
}
