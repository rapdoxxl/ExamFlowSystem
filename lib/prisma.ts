import { PrismaClient } from "@prisma/client";
import { cache } from "react";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const database =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

export const getActiveExamId = cache(async () => {
  const settings = await database.systemSetting.findUnique({ where: { id: "main" } });
  return settings?.activeExamId || "legacy";
});

// Keep all existing lists, quotas, exports and mutations restricted to this exam.
export const prisma = database.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model !== "Class" && model !== "Registration") return query(args);
        const examId = await getActiveExamId();
        const scoped = args as Record<string, any>;
        if (operation === "create") scoped.data = { ...scoped.data, examId };
        else if (operation === "createMany" || operation === "createManyAndReturn") {
          const rows = Array.isArray(scoped.data) ? scoped.data : [scoped.data];
          scoped.data = rows.map((row: Record<string, unknown>) => ({ ...row, examId }));
        } else {
          scoped.where = { ...scoped.where, examId };
          if (operation === "upsert") scoped.create = { ...scoped.create, examId };
        }
        if (scoped.data && !Array.isArray(scoped.data) && operation !== "create") delete scoped.data.examId;
        return query(args);
      }
    }
  }
});
