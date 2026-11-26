import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";

export async function POST(request: NextRequest) {
  if (!await requireRole(["SYSTEM_ADMIN"])) return jsonError("无权限", 403);
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (name.length < 2 || name.length > 80) return jsonError("考试名称应为2至80个字符");
  if (body.confirmation !== "开始新考试") return jsonError("请输入“开始新考试”确认");
  const settings = await database.systemSetting.findUnique({ where: { id: "main" } });
  if (!settings || body.activeExamId !== settings.activeExamId) return jsonError("当前考试已变更，请刷新页面后操作", 409);
  const exam = await database.$transaction(async (tx) => {
    await tx.exam.upsert({ where: { id: "legacy" }, update: {}, create: { id: "legacy", name: "历史考试（原有数据）" } });
    const created = await tx.exam.create({ data: { name } });
    // Registration is deliberately closed until the new classes and settings are ready.
    const switched = await tx.systemSetting.updateMany({ where: { id: "main", activeExamId: String(body.activeExamId) }, data: { activeExamId: created.id, registrationOpen: false, announcement: "" } });
    if (switched.count !== 1) throw new Error("考试已变更，请刷新后重试");
    return created;
  });
  return jsonOk(exam);
}
