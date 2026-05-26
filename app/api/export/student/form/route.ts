import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { attachmentResponse, buildApplicationFormHtml } from "@/lib/export/builders";
import { sanitizeFileName } from "@/lib/validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.registration) return new Response("未登录", { status: 401 });
  const registration = await prisma.registration.findUnique({ where: { id: user.registration.id }, include: { class: true } });
  if (!registration) return new Response("报名记录不存在", { status: 404 });
  const html = buildApplicationFormHtml(registration);
  return attachmentResponse(Buffer.from(html, "utf8"), `${sanitizeFileName(registration.idNumber + (registration.name || ""))}.html`, "text/html; charset=utf-8");
}
