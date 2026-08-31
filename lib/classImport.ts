import ExcelJS from "exceljs";
import { upsertClass } from "@/lib/classes";

export type ClassParts = { department: string; grade: string; name: string };

export class ClassImportFormatError extends Error {
  constructor(message = "班级导入格式不正确，请下载并使用正确的班级导入模板。") {
    super(message);
    this.name = "ClassImportFormatError";
  }
}

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export async function buildClassImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RegSysOL";
  const sheet = workbook.addWorksheet("班级导入模板");
  sheet.columns = [
    { header: "院系", key: "department", width: 24 },
    { header: "所在年级", key: "grade", width: 14 },
    { header: "班级", key: "name", width: 28 }
  ];
  sheet.addRows([
    { department: "信息工程学院", grade: "2025", name: "移动互联2531" },
    { department: "信息工程学院", grade: "2025", name: "计算机网络2531" },
    { department: "信息工程学院", grade: "2024", name: "软件技术2431" }
  ]);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFD7DEE9" } },
        left: { style: "thin", color: { argb: "FFD7DEE9" } },
        right: { style: "thin", color: { argb: "FFD7DEE9" } },
        top: { style: "thin", color: { argb: "FFD7DEE9" } }
      };
    });
  });
  const note = workbook.addWorksheet("填写说明");
  note.getCell("A1").value = "请保留第一行表头：院系、所在年级、班级。班级为必填，院系和所在年级建议填写。";
  note.getCell("A2").value = "可直接在模板示例行上修改，也可以删除示例行后粘贴自己的班级数据。";
  note.getColumn(1).width = 90;
  return workbook.xlsx.writeBuffer();
}

export async function readClassesFromWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new ClassImportFormatError("无法读取该 Excel 文件，请使用 .xlsx 格式的班级导入模板。");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ClassImportFormatError();
  const headerRow = sheet.getRow(1);
  const headers = new Map<string, number>();
  headerRow.eachCell((cell, col) => headers.set(normalizeHeader(cell.text), col));
  const departmentCol = headers.get("院系") || headers.get("学院") || 0;
  const gradeCol = headers.get("所在年级") || headers.get("年级") || 0;
  const classCol = headers.get("班级") || headers.get("班级名称") || 0;
  if (!classCol) {
    throw new ClassImportFormatError("未识别到“班级”列，请使用包含“院系 / 所在年级 / 班级”表头的正确模板。");
  }

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
  if (items.length === 0) {
    throw new ClassImportFormatError("没有读取到班级数据，请按模板填写至少一行班级。");
  }
  return items;
}

export async function importClassParts(items: ClassParts[]) {
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
