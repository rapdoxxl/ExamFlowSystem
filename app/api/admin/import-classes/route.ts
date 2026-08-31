import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireRole } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { ClassImportFormatError, importClassParts, readClassesFromWorkbook, type ClassParts } from "@/lib/classImport";

export async function POST(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return jsonError("无权限", 403);
  const data = await request.formData();
  const mode = String(data.get("mode") || "upload");
  let items: ClassParts[] = [];

  if (mode === "student-status-dir") {
    const dir = path.join(process.cwd(), "附件", "学籍信息");
    const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".xlsx") && !file.startsWith("~$"));
    for (const file of files) {
      const buffer = await fs.readFile(path.join(dir, file));
      try {
        items = items.concat(await readClassesFromWorkbook(buffer));
      } catch (error) {
        if (error instanceof ClassImportFormatError) return jsonError(`${file}：${error.message}`);
        throw error;
      }
    }
  } else {
    const file = data.get("file");
    if (!(file instanceof File)) return jsonError("请选择Excel文件");
    if (!file.name.toLowerCase().endsWith(".xlsx")) return jsonError("请使用 .xlsx 格式的班级导入模板，或另存为 .xlsx 后再导入。");
    try {
      items = await readClassesFromWorkbook(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      if (error instanceof ClassImportFormatError) return jsonError(error.message);
      throw error;
    }
  }

  const count = await importClassParts(items);
  return jsonOk({ count });
}
