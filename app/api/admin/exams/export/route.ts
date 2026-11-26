import { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireRole } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { attachmentResponse, buildAllZip, buildPhotosZip } from "@/lib/export/builders";
import { jsonError } from "@/lib/response";
import { sanitizeFileName } from "@/lib/validation";
import { getStudentRegistrationStatusLabel } from "@/lib/reviewStatus";

export async function GET(request: NextRequest) {
  if (!await requireRole(["SYSTEM_ADMIN"])) return jsonError("无权限", 403);
  const id = request.nextUrl.searchParams.get("examId") || "";
  const exam = await database.exam.findUnique({ where: { id } });
  if (!exam && id !== "legacy") return jsonError("考试不存在", 404);
  const title = sanitizeFileName(exam?.name || "历史考试（原有数据）");
  const rows = await database.registration.findMany({ where: { examId: id }, include: { class: true }, orderBy: { createdAt: "asc" } });
  const type = request.nextUrl.searchParams.get("type");
  if (type === "classes") {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("班级");
    sheet.addRow(["院系", "所在年级", "班级"]);
    const classes = await database.class.findMany({ where: { examId: id }, orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }] });
    for (const item of classes) sheet.addRow([item.department, item.grade, item.name]);
    sheet.columns.forEach((column) => { column.width = 26; });
    return attachmentResponse(await book.xlsx.writeBuffer(), `${title}班级.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  if (type === "all") return attachmentResponse(await buildAllZip(rows, title), `${title}正式材料.zip`, "application/zip");
  if (type === "photos") return attachmentResponse(await buildPhotosZip(rows), `${title}照片.zip`, "application/zip");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("存档记录");
  sheet.addRow(["考试", "姓名", "学号", "身份证号", "手机号", "院系", "年级", "班级", "科目", "报名状态", "审核意见", "缴费状态", "照片路径"]);
  for (const item of rows) sheet.addRow([title, item.name, item.studentNumber, item.idNumber, item.phone, item.class?.department, item.class?.grade, item.class?.name, item.subject, getStudentRegistrationStatusLabel(item.status, item.reviewStatus), item.reviewReason, item.paymentStatus, item.photoPath]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => { column.width = 24; });
  return attachmentResponse(await book.xlsx.writeBuffer(), `${title}存档记录（含草稿）.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
