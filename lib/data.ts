import { prisma } from "@/lib/prisma";
import { DEFAULT_ANNOUNCEMENT } from "@/lib/constants";

export async function getSettings() {
  return prisma.systemSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", registrationOpen: true, announcement: DEFAULT_ANNOUNCEMENT }
  });
}

export async function listClasses() {
  return prisma.class.findMany({ orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }] });
}
