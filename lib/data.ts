import { prisma } from "@/lib/prisma";
import { DEFAULT_ANNOUNCEMENT, DEFAULT_PAYMENT_QR_PATH } from "@/lib/constants";

export async function getSettings() {
  return prisma.systemSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", registrationOpen: true, announcement: DEFAULT_ANNOUNCEMENT, paymentQrPath: DEFAULT_PAYMENT_QR_PATH }
  });
}

export async function listClasses() {
  return prisma.class.findMany({ orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }] });
}
