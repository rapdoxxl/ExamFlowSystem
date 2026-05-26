import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";

export async function GET() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  return jsonOk(await getSettings());
}

export async function PATCH(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const body = await request.json();
  const setting = await prisma.systemSetting.update({ where: { id: "main" }, data: { registrationOpen: Boolean(body.registrationOpen) } });
  return jsonOk(setting);
}
