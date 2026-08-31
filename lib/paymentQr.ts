import path from "node:path";
import { promises as fs } from "node:fs";
import { DEFAULT_PAYMENT_QR_PATH } from "@/lib/constants";
import { paymentQrContentType } from "@/lib/upload/paymentQr";

function resolveProjectPath(relativePath?: string | null) {
  const projectRoot = process.cwd();
  const value = String(relativePath || DEFAULT_PAYMENT_QR_PATH).replace(/\\/g, "/").replace(/^\/+/, "");
  const absolutePath = path.resolve(projectRoot, value);
  const allowedRoots = [
    path.resolve(projectRoot, "public", "payment-guide"),
    path.resolve(projectRoot, "storage", "generated")
  ];
  const allowed = allowedRoots.some((root) => absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`));
  if (!allowed) {
    return path.resolve(projectRoot, DEFAULT_PAYMENT_QR_PATH);
  }
  return absolutePath;
}

export async function readPaymentQr(relativePath?: string | null) {
  const requestedPath = resolveProjectPath(relativePath);
  try {
    return {
      buffer: await fs.readFile(requestedPath),
      contentType: paymentQrContentType(requestedPath)
    };
  } catch {
    const fallbackPath = resolveProjectPath(DEFAULT_PAYMENT_QR_PATH);
    return {
      buffer: await fs.readFile(fallbackPath),
      contentType: paymentQrContentType(fallbackPath)
    };
  }
}
