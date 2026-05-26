import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.role !== "SYSTEM_ADMIN" || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("管理员账号或密码错误", 403);
  }
  await setSession(user.id, user.role);
  return jsonOk({});
}
