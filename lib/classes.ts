import { prisma, getActiveExamId } from "@/lib/prisma";

export function buildClassDisplayName(item: { department?: string | null; grade?: string | null; name: string }) {
  return [item.department, item.grade, item.name].filter(Boolean).join("-");
}

export function normalizeClassParts(input: { department?: string | null; grade?: string | null; name: string }) {
  return {
    department: String(input.department || "").trim(),
    grade: String(input.grade || "").trim(),
    name: String(input.name || "").trim()
  };
}

export async function upsertClass(parts: { department?: string | null; grade?: string | null; name: string }) {
  const data = normalizeClassParts(parts);
  if (!data.name) throw new Error("班级名称不能为空");
  return prisma.class.upsert({
    where: { examId_department_grade_name: { ...data, examId: await getActiveExamId() } },
    update: {},
    create: data
  });
}
