import type { Prisma } from "@prisma/client";
import { ensureDefaultSubjects } from "@/lib/subjects";

export type SubjectQuota = {
  key: string;
  label: string;
  limit: number;
  shortLabel: string;
  subjects: string[];
};

type RegistrationCounter = {
  registration: {
    count(args: Prisma.RegistrationCountArgs): Promise<number>;
  };
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

export class RegistrationQuotaError extends Error {
  constructor(public readonly quota: SubjectQuota) {
    super(`${quota.label}报名名额已满（限${quota.limit}人），不能继续提交报名。`);
    this.name = "RegistrationQuotaError";
  }
}

export class InvalidSubjectError extends Error {
  constructor(subject?: string | null) {
    super(subject ? `报考科目“${subject}”当前不可用，请刷新页面后重新选择。` : "请选择有效的报考科目。");
    this.name = "InvalidSubjectError";
  }
}

export async function listSubjectQuotas(client: RegistrationCounter) {
  await ensureDefaultSubjects(client);
  const subjects = await client.subject.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const quotas = new Map<string, SubjectQuota>();
  for (const subject of subjects) {
    const groupKey = subject.quotaGroup.trim();
    const key = groupKey || subject.id;
    const existing = quotas.get(key);
    if (existing) {
      existing.subjects.push(subject.name);
      existing.limit = subject.capacity;
      if (subject.quotaGroupName.trim()) existing.label = subject.quotaGroupName.trim();
    } else {
      const label = subject.quotaGroupName.trim() || subject.name;
      quotas.set(key, {
        key,
        label,
        limit: subject.capacity,
        shortLabel: label,
        subjects: [subject.name]
      });
    }
  }
  return Array.from(quotas.values());
}

export async function getSubjectQuota(client: RegistrationCounter, subject?: string | null) {
  if (!subject) throw new InvalidSubjectError(subject);
  const quota = (await listSubjectQuotas(client)).find((item) => item.subjects.includes(subject));
  if (!quota) throw new InvalidSubjectError(subject);
  return quota;
}

export async function assertSubjectAvailable(client: RegistrationCounter, subject: string | null | undefined) {
  await getSubjectQuota(client, subject);
}

export async function getSubjectQuotaUsed(client: RegistrationCounter, quota: SubjectQuota) {
  return client.registration.count({
    where: {
      status: "SUBMITTED",
      subject: { in: [...quota.subjects] }
    }
  });
}

export async function assertSubjectQuotaAvailable(client: RegistrationCounter, subject: string | null | undefined, currentRegistrationId?: string | null) {
  const quota = await getSubjectQuota(client, subject);

  const where: Prisma.RegistrationWhereInput = {
    status: "SUBMITTED",
    subject: { in: [...quota.subjects] }
  };
  if (currentRegistrationId) {
    where.id = { not: currentRegistrationId };
  }

  const used = await client.registration.count({ where });
  if (used >= quota.limit) {
    throw new RegistrationQuotaError(quota);
  }
}
