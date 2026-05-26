import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return new Response("无权限", { status: 403 });

  const id = request.nextUrl.searchParams.get("id") || "";
  const registration = await prisma.registration.findUnique({ where: { id }, select: { photoPath: true } });
  if (!registration?.photoPath) return new Response("照片不存在", { status: 404 });

  const photosDir = path.resolve(process.cwd(), "storage", "photos");
  const photoPath = path.resolve(process.cwd(), registration.photoPath);
  if (photoPath === photosDir || !photoPath.startsWith(`${photosDir}${path.sep}`)) {
    return new Response("照片路径不合法", { status: 400 });
  }

  try {
    const file = await fs.readFile(photoPath);
    const body = new ArrayBuffer(file.byteLength);
    new Uint8Array(body).set(file);
    return new Response(body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "image/jpeg"
      }
    });
  } catch {
    return new Response("照片不存在", { status: 404 });
  }
}
