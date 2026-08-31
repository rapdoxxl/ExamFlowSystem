import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/response";
import { validateAndSavePaymentQr } from "@/lib/upload/paymentQr";

export async function POST(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);

  const formData = await request.formData();
  const file = formData.get("paymentQr");
  if (!(file instanceof File)) return jsonError("请选择缴费二维码图片");

  try {
    const paymentQrPath = await validateAndSavePaymentQr(file);
    const settings = await prisma.systemSetting.upsert({
      where: { id: "main" },
      update: { paymentQrPath },
      create: { id: "main", registrationOpen: true, announcement: DEFAULT_ANNOUNCEMENT, paymentQrPath }
    });
    return jsonOk({ paymentQrPath: settings.paymentQrPath, updatedAt: settings.updatedAt });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "二维码上传失败");
  }
}
