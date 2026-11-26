import { PrismaClient } from "@prisma/client";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();

async function main() {
  const hasColumn = async (table: string, column: string) => {
    const columns = await db.$queryRawUnsafe<Array<{ name: string }>>(`PRAGMA table_info("${table}")`);
    return columns.some((item) => item.name === column);
  };
  if (await hasColumn("SystemSetting", "activeExamId")) {
    console.log("Exam migration already applied.");
    return;
  }
  const before = await db.$queryRawUnsafe<Array<{ count: bigint }>>('SELECT COUNT(*) as count FROM "Registration"');
  await mkdir("backups", { recursive: true });
  const backup = path.resolve("backups", `before-exams-${Date.now()}.db`);
  await db.$executeRawUnsafe(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
  console.log(`Backup: ${backup}`);
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('ALTER TABLE "Class" ADD COLUMN "examId" TEXT NOT NULL DEFAULT \'legacy\'');
    await tx.$executeRawUnsafe('ALTER TABLE "Registration" ADD COLUMN "examId" TEXT NOT NULL DEFAULT \'legacy\'');
    await tx.$executeRawUnsafe('ALTER TABLE "SystemSetting" ADD COLUMN "activeExamId" TEXT NOT NULL DEFAULT \'legacy\'');
    await tx.$executeRawUnsafe('CREATE TABLE "Exam" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    await tx.$executeRawUnsafe('INSERT INTO "Exam" ("id", "name") VALUES (\'legacy\', \'历史考试（原有数据）\')');
    await tx.$executeRawUnsafe('DROP INDEX IF EXISTS "Registration_idNumber_key"');
    await tx.$executeRawUnsafe('DROP INDEX IF EXISTS "Class_department_grade_name_key"');
    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX "Registration_examId_idNumber_key" ON "Registration"("examId", "idNumber")');
    await tx.$executeRawUnsafe('CREATE UNIQUE INDEX "Class_examId_department_grade_name_key" ON "Class"("examId", "department", "grade", "name")');
    const after = await tx.$queryRawUnsafe<Array<{ count: bigint }>>('SELECT COUNT(*) as count FROM "Registration"');
    if (String(before[0].count) !== String(after[0].count)) throw new Error("Registration count changed during migration");
  });
  console.log(`Migration complete; ${before[0].count} registrations preserved.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
