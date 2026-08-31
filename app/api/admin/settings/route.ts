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
  const data: { registrationOpen?: boolean; announcement?: string } = {};
  if (typeof body.registrationOpen === "boolean") data.registrationOpen = body.registrationOpen;
  if (typeof body.announcement === "string") {
    const announcement = body.announcement.trim();
    if (announcement.length > 500) return jsonError("通知公告不能超过 500 个字符。", 400);
    data.announcement = announcement;
  }
  if (Object.keys(data).length === 0) return jsonError("没有可保存的设置。", 400);
  const setting = await prisma.systemSetting.update({ where: { id: "main" }, data });
  return jsonOk(setting);
}
