import type { Prisma } from "@prisma/client";

export async function saveExamSettings(tx: Prisma.TransactionClient, settings: { activeExamId: string; registrationOpen: boolean; announcement: string; paymentQrPath: string }) {
  const data = {
    activeExamId: settings.activeExamId,
    registrationOpen: settings.registrationOpen,
    announcement: settings.announcement,
    paymentQrPath: settings.paymentQrPath
  };
  await tx.systemSetting.upsert({ where: { id: `exam:${settings.activeExamId}` }, create: { id: `exam:${settings.activeExamId}`, ...data }, update: data });
}
