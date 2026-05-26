import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachmentResponse, buildPaymentWorkbook } from "@/lib/export/builders";
import { sanitizeFileName } from "@/lib/validation";

export async function GET() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user?.classId) return new Response("无权限", { status: 403 });
  const rows = await prisma.registration.findMany({ where: { classId: user.classId }, include: { class: true }, orderBy: { createdAt: "asc" } });
  const title = sanitizeFileName(user.class?.name || "本班");
  return attachmentResponse(await buildPaymentWorkbook(rows, title), `${title}缴费报名表.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
