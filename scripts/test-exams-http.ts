import assert from "node:assert/strict";
import crypto from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

async function main() {
  await mkdir(".codex-tmp", { recursive: true });
  const file = path.resolve(".codex-tmp", `exam-http-${Date.now()}.db`);
  await copyFile("prisma/dev.db", file);
  const url = `file:${file.replace(/\\/g, "/")}`;
  const db = new PrismaClient({ datasourceUrl: url });
  const secret = "isolated-exam-test-secret";
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "8020", "-H", "127.0.0.1"], { env: { ...process.env, DATABASE_URL: url, AUTH_SECRET: secret }, stdio: "pipe", windowsHide: true });
  let logs = "";
  server.stderr.on("data", (chunk) => { logs += chunk; });
  const base = "http://127.0.0.1:8020";
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try { ready = (await fetch(`${base}/reg`)).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert(ready, logs);
    const admin = await db.user.findFirstOrThrow({ where: { role: "SYSTEM_ADMIN" } });
    const original = await db.registration.findFirstOrThrow();
    const total = await db.registration.count();
    const encoded = Buffer.from(JSON.stringify({ userId: admin.id, role: admin.role, exp: Date.now() + 600000 })).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
    const headers = { cookie: `regsysol_session=${encoded}.${signature}`, "Content-Type": "application/json" };
    assert.equal((await fetch(`${base}/api/admin/exams/export?examId=legacy`)).status, 403);
    const page = await fetch(`${base}/xxgcxy/exams`, { headers });
    assert.equal(page.status, 200);
    assert((await page.text()).includes("历史考试"));
    const active = (await db.systemSetting.findUniqueOrThrow({ where: { id: "main" } })).activeExamId;
    const create = await fetch(`${base}/api/admin/exams`, { method: "POST", headers, body: JSON.stringify({ name: "HTTP测试考试", confirmation: "开始新考试", activeExamId: active }) });
    assert.equal(create.status, 200, await create.clone().text());
    const duplicate = await fetch(`${base}/api/admin/exams`, { method: "POST", headers, body: JSON.stringify({ name: "重复测试", confirmation: "开始新考试", activeExamId: active }) });
    assert.equal(duplicate.status, 409);
    const classes = await (await fetch(`${base}/api/admin/classes`, { headers })).json();
    assert.equal(classes.data.length, 0);
    const registrations = await (await fetch(`${base}/api/admin/registrations`, { headers })).json();
    assert.equal(registrations.data.length, 0);
    const settings = await db.systemSetting.findUniqueOrThrow({ where: { id: "main" } });
    assert.equal(settings.registrationOpen, false);
    assert.equal(settings.announcement, "");
    const archive = await fetch(`${base}/api/admin/exams/export?examId=legacy`, { headers });
    assert.equal(archive.status, 200);
    assert((await archive.arrayBuffer()).byteLength > 1000);
    await db.systemSetting.update({ where: { id: "main" }, data: { registrationOpen: true } });
    const form = new FormData();
    form.set("idNumber", original.idNumber);
    form.set("phone", "13800138000");
    form.set("intent", "draft");
    const saved = await fetch(`${base}/api/student/register`, { method: "POST", body: form });
    assert.equal(saved.status, 200, await saved.clone().text());
    assert.equal(await db.registration.count({ where: { examId: active } }), total);
    assert.equal(await db.registration.count({ where: { examId: settings.activeExamId } }), 1);
    console.log("PASS: authorization; history page/export; create exam; stale duplicate blocked; empty lists; closed registration; same student saves new draft; history unchanged.");
  } finally {
    server.kill();
    await new Promise<void>((resolve) => { if (server.exitCode !== null) resolve(); else server.once("exit", () => resolve()); });
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
