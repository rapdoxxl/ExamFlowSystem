import { prisma } from "@/lib/prisma";

export async function getSettings() {
  return prisma.systemSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", registrationOpen: true }
  });
}

export async function listClasses() {
  return prisma.class.findMany({ orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }] });
}
