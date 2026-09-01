import { z } from "zod";

const provinceCodes = new Set([
  "11", "12", "13", "14", "15", "21", "22", "23", "31", "32", "33", "34", "35", "36", "37", "41", "42", "43", "44", "45", "46", "50", "51", "52", "53", "54", "61", "62", "63", "64", "65", "71", "81", "82", "91"
]);

export function isValidChineseIdNumber(idNumber: string) {
  const value = idNumber.toUpperCase();
  if (!/^\d{17}[\dX]$/.test(value)) return false;
  if (!provinceCodes.has(value.slice(0, 2))) return false;
  const year = Number(value.slice(6, 10));
  const month = Number(value.slice(10, 12));
  const day = Number(value.slice(12, 14));
  const birthDate = new Date(year, month - 1, day);
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checks = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = value.slice(0, 17).split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return checks[sum % 11] === value[17];
}

export function parseChineseIdNumber(idNumber: string) {
  const value = idNumber.toUpperCase();
  const year = value.slice(6, 10);
  const month = value.slice(10, 12);
  const day = value.slice(12, 14);
  const gender = Number(value[16]) % 2 === 1 ? "男" : "女";
  return {
    birthDate: `${year}-${month}-${day}`,
    birthMonth: `${year}年${month}月`,
    gender
  };
}

export const idNumberSchema = z.string().trim().transform((value) => value.toUpperCase()).refine(isValidChineseIdNumber, "请输入合法的18位大陆居民身份证号");

export const phoneSchema = z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入合法的11位手机号");

export const registrationBaseSchema = z.object({
  idNumber: idNumberSchema,
  queryPassword: z.string().trim().optional(),
  name: z.string().trim().min(2, "姓名至少2个字符").max(30, "姓名过长"),
  studentNumber: z.string().trim().min(1, "请输入学号").max(30, "学号过长"),
  classId: z.string().trim().min(1, "请选择班级"),
  phone: phoneSchema,
  address: z.string().trim().min(5, "家庭地址至少5个字符").max(200, "家庭地址过长"),
  subject: z.string().trim().min(1, "请选择报考科目").max(100, "报考科目过长")
});

export const draftRegistrationSchema = z.object({
  idNumber: idNumberSchema,
  queryPassword: z.string().trim().optional(),
  phone: phoneSchema
});

export const submittedRegistrationSchema = registrationBaseSchema;

export function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "").slice(0, 100);
}
