import type { Prisma } from "@prisma/client";
import { SUBJECTS } from "@/lib/constants";

export const SUBJECT_QUOTAS = [
  {
    key: "cad",
    label: "AutoCAD计算机辅助设计（中级+高级）",
    shortLabel: "CAD中级+高级",
    subjects: [SUBJECTS[0], SUBJECTS[1]],
    limit: 320
  },
  {
    key: "protel",
    label: "Protel计算机辅助设计",
    shortLabel: "Protel",
    subjects: [SUBJECTS[2]],
    limit: 160
  }
] as const;

type RegistrationCounter = {
  registration: {
    count(args: Prisma.RegistrationCountArgs): Promise<number>;
  };
};

export class RegistrationQuotaError extends Error {
  constructor(public readonly quota: (typeof SUBJECT_QUOTAS)[number]) {
    super(`${quota.label}报名名额已满（限${quota.limit}人），不能继续提交报名。`);
    this.name = "RegistrationQuotaError";
  }
}

export function getSubjectQuota(subject?: string | null) {
  if (!subject) return undefined;
  return SUBJECT_QUOTAS.find((quota) => (quota.subjects as readonly string[]).includes(subject));
}

export async function getSubjectQuotaUsed(client: RegistrationCounter, quota: (typeof SUBJECT_QUOTAS)[number]) {
  return client.registration.count({
    where: {
      status: "SUBMITTED",
      subject: { in: [...quota.subjects] }
    }
  });
}

export async function assertSubjectQuotaAvailable(client: RegistrationCounter, subject: string | null | undefined, currentRegistrationId?: string | null) {
  const quota = getSubjectQuota(subject);
  if (!quota) return;

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
