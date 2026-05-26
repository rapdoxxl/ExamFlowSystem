import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";
import { isValidChineseIdNumber } from "@/lib/validation";

const PHOTO_DIR = path.join(process.cwd(), "storage", "photos");
const MAX_PHOTO_SIZE = 20 * 1024;

export async function validateAndSavePhoto(file: File, idNumber: string) {
  if (!isValidChineseIdNumber(idNumber)) throw new Error("身份证号不合法");
  if (!file.name.toLowerCase().endsWith(".jpg")) throw new Error("照片文件扩展名必须为 .jpg");
  if (file.type && !["image/jpeg", "image/jpg"].includes(file.type.toLowerCase())) throw new Error("照片格式必须为 JPG");
  if (file.size > MAX_PHOTO_SIZE) throw new Error("照片大小不能超过20KB");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_PHOTO_SIZE) throw new Error("照片大小不能超过20KB");
  const meta = await sharp(buffer).metadata();
  if (meta.format !== "jpeg") throw new Error("照片真实格式必须为 JPG");
  if (meta.width !== 90 || meta.height !== 110) throw new Error("照片像素必须严格为90px×110px");
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  const relativePath = path.join("storage", "photos", `${idNumber}.jpg`).replace(/\\/g, "/");
  await fs.writeFile(path.join(process.cwd(), relativePath), buffer);
  return relativePath;
}
