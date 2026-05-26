import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireRole } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/response";
import { upsertClass } from "@/lib/classes";

type ClassParts = { department: string; grade: string; name: string };

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").trim();
}

async function readClassesFromWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headerRow = sheet.getRow(1);
  const headers = new Map<string, number>();
  headerRow.eachCell((cell, col) => headers.set(normalizeHeader(cell.text), col));
  const departmentCol = headers.get("院系") || headers.get("学院") || 0;
  const gradeCol = headers.get("所在年级") || headers.get("年级") || 0;
  const classCol = headers.get("班级") || 1;
  const items: ClassParts[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = String(row.getCell(classCol).text || "").trim();
    if (!name || name === "班级") return;
    items.push({
      department: departmentCol ? String(row.getCell(departmentCol).text || "").trim() : "",
      grade: gradeCol ? String(row.getCell(gradeCol).text || "").trim() : "",
      name
    });
  });
  return items;
}

async function importClassParts(items: ClassParts[]) {
  const unique = new Map<string, ClassParts>();
  for (const item of items) {
    const key = `${item.department}\t${item.grade}\t${item.name}`;
    unique.set(key, item);
  }
  let count = 0;
  for (const item of unique.values()) {
    await upsertClass(item);
    count += 1;
  }
  return count;
}

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
      items = items.concat(await readClassesFromWorkbook(buffer));
    }
  } else {
    const file = data.get("file");
    if (!(file instanceof File)) return jsonError("请选择Excel文件");
    items = await readClassesFromWorkbook(Buffer.from(await file.arrayBuffer()));
  }

  const count = await importClassParts(items);
  return jsonOk({ count });
}
