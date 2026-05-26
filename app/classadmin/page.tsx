import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildClassDisplayName } from "@/lib/classes";

export default async function ClassAdminHomePage() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user) {
    return (
      <main className="container grid">
        <div className="actions"><Link href="/reg">学生入口</Link></div>
        <h1>班级管理员登录</h1>
        <LoginForm type="classadmin" />
      </main>
    );
  }
  if (!user.classId) return <main className="container"><div className="error">未绑定班级。</div></main>;
  const [total, submitted, pending, approved, rejected] = await Promise.all([
    prisma.registration.count({ where: { classId: user.classId } }),
    prisma.registration.count({ where: { classId: user.classId, status: "SUBMITTED" } }),
    prisma.registration.count({ where: { classId: user.classId, status: "SUBMITTED", reviewStatus: "PENDING" } }),
    prisma.registration.count({ where: { classId: user.classId, status: "SUBMITTED", reviewStatus: "APPROVED" } }),
    prisma.registration.count({ where: { classId: user.classId, status: "SUBMITTED", reviewStatus: "REJECTED" } })
  ]);
  return (
    <main className="container grid">
      <h1>{user.class ? buildClassDisplayName(user.class) : "本班"} 管理概览</h1>
      <div className="grid grid-3">
        <div className="stat"><b>{total}</b>本班登记人数</div>
        <div className="stat"><b>{submitted}</b>已提交人数</div>
        <div className="stat"><b>{pending}</b>待审核人数</div>
        <div className="stat"><b>{approved}</b>报名成功人数</div>
        <div className="stat"><b>{rejected}</b>审核不通过人数</div>
      </div>
    </main>
  );
}
