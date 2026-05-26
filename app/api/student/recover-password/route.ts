import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQueryPassword, hashPassword } from "@/lib/password";
import { jsonError, jsonOk } from "@/lib/response";
import { idNumberSchema, phoneSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const idNumber = idNumberSchema.safeParse(body.idNumber);
  const phone = phoneSchema.safeParse(body.phone);
  if (!idNumber.success || !phone.success) return jsonError("身份信息核验失败，请检查后重试", 403);

  const registration = await prisma.registration.findUnique({ where: { idNumber: idNumber.data } });
  if (!registration || registration.phone !== phone.data) {
    return jsonError("身份信息核验失败，请检查后重试", 403);
  }

  const queryPassword = generateQueryPassword();
  await prisma.registration.update({
    where: { id: registration.id },
    data: { queryPasswordHash: await hashPassword(queryPassword) }
  });

  return jsonOk({ queryPassword });
}
