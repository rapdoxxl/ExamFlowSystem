import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachmentResponse, buildFormsZip } from "@/lib/export/builders";
import { sanitizeFileName } from "@/lib/validation";

export async function GET() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user?.classId) return new Response("无权限", { status: 403 });
  const rows = await prisma.registration.findMany({ where: { classId: user.classId }, include: { class: true }, orderBy: { createdAt: "asc" } });
  const title = sanitizeFileName(user.class?.name || "本班");
  return attachmentResponse(await buildFormsZip(rows), `${title}申报表.zip`, "application/zip");
}
