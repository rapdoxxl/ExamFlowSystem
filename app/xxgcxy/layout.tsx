import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <>{children}</>;
  return (
    <>
      <nav className="nav">
        <strong>系统管理员后台</strong>
        <Link href="/xxgcxy">首页</Link>
        <Link href="/xxgcxy/classes">班级管理</Link>
        <Link href="/xxgcxy/students">考生管理</Link>
        <Link href="/xxgcxy/settings">系统设置</Link>
        <Link href="/xxgcxy/export">数据导出</Link>
        <LogoutButton api="/api/admin/logout" to="/xxgcxy/login" />
      </nav>
      {children}
    </>
  );
}
