import assert from "node:assert/strict";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

async function main() {
  await mkdir(".codex-tmp", { recursive: true });
  const fixture = path.resolve(".codex-tmp", `exam-test-${Date.now()}.db`);
  await copyFile(path.resolve("prisma/dev.db"), fixture);
  process.env.DATABASE_URL = `file:${fixture.replace(/\\/g, "/")}`;
  const { prisma, database } = await import("../lib/prisma");
  try {
    const original = await database.registration.findFirstOrThrow({ where: { examId: "legacy" } });
    const originalCount = await database.registration.count({ where: { examId: "legacy" } });
    const exam = await database.exam.create({ data: { name: "批次隔离测试" } });
    await database.systemSetting.update({ where: { id: "main" }, data: { activeExamId: exam.id } });
    assert.equal(await prisma.registration.count(), 0);
    assert.equal(await prisma.class.count(), 0);
    assert.equal(await prisma.registration.findUnique({ where: { id: original.id } }), null);
    assert.equal((await prisma.registration.updateMany({ where: { id: original.id }, data: { reviewStatus: "REJECTED" } })).count, 0);
    const oldClass = await database.class.findFirstOrThrow({ where: { examId: "legacy" } });
    const nextClass = await prisma.class.create({ data: { name: oldClass.name, grade: oldClass.grade, department: oldClass.department } });
    assert.equal(nextClass.examId, exam.id);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { username: `${exam.id}:${original.idNumber}`, role: "STUDENT", classId: nextClass.id } });
      await tx.registration.create({ data: { userId: user.id, idNumber: original.idNumber, queryPasswordHash: original.queryPasswordHash, classId: nextClass.id, status: "DRAFT" } });
    });
    assert.equal(await prisma.registration.count(), 1);
    assert.equal((await prisma.registration.findFirstOrThrow({ where: { idNumber: original.idNumber } })).examId, exam.id);
    assert.equal(await database.registration.count({ where: { examId: "legacy" } }), originalCount);
    assert.deepEqual(await database.registration.findUnique({ where: { id: original.id } }), original);
    console.log("PASS: empty new exam; repeated class and ID; scoped read/bulk write; transactional creation; unchanged history.");
  } finally { await database.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
