import { requireRole } from "@/lib/auth";
import { buildClassImportTemplate } from "@/lib/classImport";

export async function GET() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return new Response("无权限", { status: 403 });
  const buffer = await buildClassImportTemplate();
  const fileName = encodeURIComponent("班级导入模板.xlsx");
  return new Response(buffer, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  });
}
