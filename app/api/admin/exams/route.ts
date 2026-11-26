import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { saveExamSettings } from "@/lib/examSettings";

export async function PATCH(request: NextRequest) {
  if (!await requireRole(["SYSTEM_ADMIN"])) return jsonError("无权限", 403);
  const body = await request.json();
  const id = String(body.examId || "");
  if (!id || !body.activeExamId) return jsonError("缺少考试批次");
  try {
    await database.$transaction(async (tx) => {
      const current = await tx.systemSetting.findUniqueOrThrow({ where: { id: "main" } });
      if (current.activeExamId !== body.activeExamId) throw new Error("当前考试已变更，请刷新后重试");
      if (!await tx.exam.findUnique({ where: { id } })) throw new Error("考试不存在");
      if (id === current.activeExamId) return;
      await saveExamSettings(tx, current);
      const saved = await tx.systemSetting.findUnique({ where: { id: `exam:${id}` } });
      await tx.systemSetting.update({ where: { id: "main" }, data: {
        activeExamId: id,
        registrationOpen: saved?.registrationOpen ?? false,
        announcement: saved?.announcement ?? "",
        paymentQrPath: saved?.paymentQrPath ?? current.paymentQrPath
      } });
    });
    return jsonOk({});
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "切换失败", 409);
  }
}

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
    await saveExamSettings(tx, settings);
    return created;
  });
  return jsonOk(exam);
}
