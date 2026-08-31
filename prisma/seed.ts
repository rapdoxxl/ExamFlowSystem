import { prisma } from "../lib/prisma";
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME } from "../lib/constants";
import { hashPassword } from "../lib/password";
import { ensureDefaultSubjects } from "../lib/subjects";

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: { passwordHash, role: "SYSTEM_ADMIN" },
    create: { username: adminUsername, passwordHash, role: "SYSTEM_ADMIN" }
  });

  await prisma.systemSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", registrationOpen: true }
  });

  await ensureDefaultSubjects(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
