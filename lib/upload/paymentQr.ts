import path from "node:path";
import { promises as fs } from "node:fs";
import sharp from "sharp";

const PAYMENT_QR_DIR = path.join(process.cwd(), "storage", "generated");
const MAX_QR_SIZE = 2 * 1024 * 1024;
const FORMAT_EXTENSIONS: Record<string, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp"
};

export function paymentQrContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function validateAndSavePaymentQr(file: File) {
  if (!file || file.size <= 0) throw new Error("请选择缴费二维码图片");
  if (file.size > MAX_QR_SIZE) throw new Error("二维码图片大小不能超过 2MB");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_QR_SIZE) throw new Error("二维码图片大小不能超过 2MB");

  const meta = await sharp(buffer).metadata();
  const ext = meta.format ? FORMAT_EXTENSIONS[meta.format] : "";
  if (!ext) throw new Error("二维码图片仅支持 JPG、PNG 或 WebP 格式");
  if (!meta.width || !meta.height || meta.width < 120 || meta.height < 120) throw new Error("二维码图片尺寸过小，请上传清晰的二维码图片");

  await fs.mkdir(PAYMENT_QR_DIR, { recursive: true });
  await Promise.all(["jpg", "jpeg", "png", "webp"].map(async (item) => {
    try {
      await fs.unlink(path.join(PAYMENT_QR_DIR, `payment-qr.${item}`));
    } catch {
      // Missing old uploads can be ignored.
    }
  }));

  const relativePath = path.join("storage", "generated", `payment-qr.${ext}`).replace(/\\/g, "/");
  await fs.writeFile(path.join(process.cwd(), relativePath), buffer);
  return relativePath;
}
