import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { idNumberSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const idNumber = idNumberSchema.safeParse(body.idNumber);
  if (!idNumber.success) return jsonError("身份证号不合法");
  const queryPassword = String(body.queryPassword || "").trim();
  if (!/^\d{6}$/.test(queryPassword)) return jsonError("查询密码应为6位数字");
  const registration = await prisma.registration.findUnique({ where: { idNumber: idNumber.data }, include: { user: true } });
  if (!registration || !(await verifyPassword(queryPassword, registration.queryPasswordHash))) return jsonError("身份证号或查询密码错误", 403);
  await setSession(registration.userId, registration.user.role);
  return jsonOk({ role: registration.user.role });
}
