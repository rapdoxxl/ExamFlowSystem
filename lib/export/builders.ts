import { promises as fs } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import type { Prisma } from "@prisma/client";
import { FIXED_EXPORT_VALUES, PAYMENT_AMOUNT } from "@/lib/constants";
import { sanitizeFileName } from "@/lib/validation";
import { buildClassDisplayName } from "@/lib/classes";

export type RegistrationWithClass = Prisma.RegistrationGetPayload<{ include: { class: true } }>;

const attachmentDir = path.join(process.cwd(), "附件");
const importTemplatePath = path.join(attachmentDir, "附件二.考生导入模板.xlsx");
const paymentTemplatePath = path.join(attachmentDir, "附件三.缴费报名表.xlsx");

function approvedOnly(rows: RegistrationWithClass[]) {
  return rows.filter((item) => item.status === "SUBMITTED" && item.reviewStatus === "APPROVED");
}

function projectName(subject?: string | null) {
  return subject?.replace(/^高级：|^中级：/, "") || "";
}

export async function buildImportTemplate(rows: RegistrationWithClass[]) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(importTemplatePath);
  const sheet = workbook.getWorksheet("考生信息") || workbook.worksheets[0];
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.values = [];
    row.commit();
  }
  approvedOnly(rows).forEach((item, index) => {
    const row = sheet.getRow(index + 3);
    row.getCell(1).value = item.name || "";
    row.getCell(2).value = FIXED_EXPORT_VALUES.documentType;
    row.getCell(3).value = item.idNumber;
    row.getCell(4).value = item.birthDate || "";
    row.getCell(5).value = item.gender || "";
    row.getCell(6).value = FIXED_EXPORT_VALUES.candidateSource;
    row.getCell(7).value = item.class?.name || "";
    row.getCell(8).value = FIXED_EXPORT_VALUES.workYears;
    row.getCell(9).value = FIXED_EXPORT_VALUES.educationLevel;
    row.getCell(10).value = item.phone || "";
    row.getCell(11).value = item.address || "";
    row.getCell(12).value = projectName(item.subject);
    row.getCell(13).value = FIXED_EXPORT_VALUES.appraisalType;
    row.getCell(14).value = FIXED_EXPORT_VALUES.city;
    row.getCell(15).value = "";
    row.commit();
  });
  return workbook.xlsx.writeBuffer();
}

export async function buildPaymentWorkbook(rows: RegistrationWithClass[], title: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(paymentTemplatePath);
  const sheet = workbook.worksheets[0];
  sheet.getCell("A1").value = `${title}报名表`;
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.values = [];
    row.commit();
  }
  approvedOnly(rows).forEach((item, index) => {
    const row = sheet.getRow(index + 3);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.name || "";
    row.getCell(3).value = item.studentNumber || "";
    row.getCell(4).value = PAYMENT_AMOUNT;
    row.getCell(5).value = projectName(item.subject);
    row.getCell(6).value = "";
    row.commit();
  });
  return workbook.xlsx.writeBuffer();
}

export function buildApplicationFormHtml(item: RegistrationWithClass) {
  const subject = projectName(item.subject);
  const level = item.subject?.startsWith("高级") ? "高级" : item.subject?.startsWith("中级") ? "中级" : "中级";
  const photoText = item.photoPath ? "电子照片已上传" : "未上传";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>福建省专项职业能力考核申报表</title><style>
  body{font-family:SimSun,serif;color:#000;margin:24px}.form{width:760px;margin:0 auto}.title{text-align:center;font-size:24px;font-weight:bold;margin-bottom:18px}table{width:100%;border-collapse:collapse;table-layout:fixed}td{border:1px solid #000;padding:8px;height:34px;vertical-align:middle}.center{text-align:center}.photo{height:160px;text-align:center}.note{font-size:13px;line-height:1.7;margin-top:12px}.blank{height:90px}.no-border{border:0}.small{font-size:13px}@media print{body{margin:0}.form{width:100%}}
  </style></head><body><div class="form"><div class="title">福建省专项职业能力考核申报表</div><table>
  <tr><td class="center" style="width:90px">姓名</td><td>${escapeHtml(item.name || "")}</td><td class="center" style="width:80px">性别</td><td>${escapeHtml(item.gender || "")}</td><td class="center photo" rowspan="4" style="width:150px">${photoText}<br><span class="small">白底彩照<br>90×110 JPG</span></td></tr>
  <tr><td class="center">出生年月</td><td>${escapeHtml((item.birthDate || "").slice(0, 7))}</td><td class="center">文化程度</td><td>大专在读</td></tr>
  <tr><td class="center">证件类别</td><td colspan="3">大陆居民身份证</td></tr>
  <tr><td class="center">证件号码</td><td colspan="3">${escapeHtml(item.idNumber)}</td></tr>
  <tr><td class="center">家庭地址</td><td colspan="4">${escapeHtml(item.address || "")}</td></tr>
  <tr><td class="center">邮政编码</td><td></td><td class="center">电话号码</td><td colspan="2">${escapeHtml(item.phone || "")}</td></tr>
  <tr><td class="center">工作单位</td><td colspan="4">福建水利电力职业技术学院 ${escapeHtml(item.class ? buildClassDisplayName(item.class) : "")}</td></tr>
  <tr><td class="center">申报项目</td><td colspan="2">${escapeHtml(subject)}</td><td class="center">申报等级</td><td>${escapeHtml(level)}</td></tr>
  <tr><td class="center" colspan="5">身份证复印件粘贴处</td></tr>
  <tr><td colspan="5" class="blank"></td></tr>
  <tr><td class="center">鉴定站意见</td><td colspan="4" class="blank">同意申报<br><br><div style="text-align:right">年&nbsp;&nbsp;&nbsp;&nbsp;月&nbsp;&nbsp;&nbsp;&nbsp;日&nbsp;&nbsp;&nbsp;&nbsp;（章）</div></td></tr>
  </table><div class="note">注：申报人应如实填写本人信息；电子照片按身份证号命名，JPG格式，90×110像素，文件大小不超过20KB。</div></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function buildFormsZip(rows: RegistrationWithClass[]) {
  const zip = new JSZip();
  for (const item of approvedOnly(rows)) {
    const fileName = `${sanitizeFileName(item.idNumber + (item.name || ""))}.html`;
    zip.file(fileName, buildApplicationFormHtml(item));
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

export async function buildPhotosZip(rows: RegistrationWithClass[]) {
  const zip = new JSZip();
  for (const item of approvedOnly(rows)) {
    if (!item.photoPath) continue;
    const absolutePath = path.join(process.cwd(), item.photoPath);
    try {
      const file = await fs.readFile(absolutePath);
      zip.file(`${sanitizeFileName(item.idNumber)}.jpg`, file);
    } catch {}
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

export async function buildAllZip(rows: RegistrationWithClass[], title: string) {
  const zip = new JSZip();
  zip.file(`${title}考生导入模板.xlsx`, Buffer.from(await buildImportTemplate(rows)));
  zip.file(`${title}缴费报名表.xlsx`, Buffer.from(await buildPaymentWorkbook(rows, title)));
  zip.file(`${title}申报表.zip`, await buildFormsZip(rows));
  zip.file(`${title}电子照片.zip`, await buildPhotosZip(rows));
  return zip.generateAsync({ type: "nodebuffer" });
}

export function attachmentResponse(buffer: Buffer | ArrayBuffer, fileName: string, contentType: string) {
  const encoded = encodeURIComponent(fileName);
  const source = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const body = new ArrayBuffer(source.byteLength);
  new Uint8Array(body).set(source);
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store"
    }
  });
}
