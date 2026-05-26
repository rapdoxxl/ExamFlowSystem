import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachmentResponse, buildFormsZip } from "@/lib/export/builders";
import { sanitizeFileName } from "@/lib/validation";

export async function GET(request: Request) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return new Response("无权限", { status: 403 });
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId") || undefined;
  const classInfo = classId ? await prisma.class.findUnique({ where: { id: classId } }) : null;
  const rows = await prisma.registration.findMany({ where: { classId: classId || undefined }, include: { class: true }, orderBy: { createdAt: "asc" } });
  const title = sanitizeFileName(classInfo?.name || "全部报名数据");
  return attachmentResponse(await buildFormsZip(rows), `${title}申报表.zip`, "application/zip");
}
