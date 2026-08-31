import type { Prisma } from "@prisma/client";
import { DEFAULT_SUBJECTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type SubjectClient = {
  subject: {
    count(args?: Prisma.SubjectCountArgs): Promise<number>;
    createMany(args: Prisma.SubjectCreateManyArgs): Promise<Prisma.BatchPayload>;
    findMany(args?: Prisma.SubjectFindManyArgs): Promise<Array<{
      capacity: number;
      enabled: boolean;
      id: string;
      name: string;
      quotaGroup: string;
      quotaGroupName: string;
      sortOrder: number;
    }>>;
  };
};

export type SubjectOption = Awaited<ReturnType<typeof listSubjects>>[number];

export async function ensureDefaultSubjects(client: SubjectClient = prisma) {
  const count = await client.subject.count();
  if (count > 0) return;
  await client.subject.createMany({
    data: DEFAULT_SUBJECTS.map((subject, index) => ({
      ...subject,
      enabled: true,
      sortOrder: index + 1
    }))
  });
}

export async function listSubjects(includeDisabled = false) {
  await ensureDefaultSubjects();
  return prisma.subject.findMany({
    where: includeDisabled ? undefined : { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
}

export async function findActiveSubjectByName(client: SubjectClient, name?: string | null) {
  const value = String(name || "").trim();
  if (!value) return null;
  const subjects = await client.subject.findMany({
    where: { enabled: true, name: value },
    orderBy: [{ sortOrder: "asc" }]
  });
  return subjects[0] || null;
}

export function normalizeSubjectInput(input: {
  capacity?: unknown;
  name?: unknown;
  quotaGroup?: unknown;
  quotaGroupName?: unknown;
  sortOrder?: unknown;
}) {
  const name = String(input.name || "").trim();
  const capacity = Number(input.capacity);
  const quotaGroup = String(input.quotaGroup || "").trim();
  return {
    capacity: Number.isInteger(capacity) && capacity > 0 ? capacity : 0,
    name,
    quotaGroup,
    quotaGroupName: String(input.quotaGroupName || "").trim(),
    sortOrder: Number.isInteger(Number(input.sortOrder)) ? Number(input.sortOrder) : 0
  };
}

export function projectName(subject?: string | null) {
  return subject?.replace(/^高级：|^中级：/, "") || "";
}
