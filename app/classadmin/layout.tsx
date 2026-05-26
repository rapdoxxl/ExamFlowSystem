import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { requireRole } from "@/lib/auth";

export default async function ClassAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user) return <>{children}</>;
  return (
    <>
      <nav className="nav">
        <strong>班级管理员后台</strong>
        <Link href="/classadmin">首页</Link>
        <Link href="/classadmin/students">本班考生</Link>
        <Link href="/classadmin/export">本班导出</Link>
        <LogoutButton api="/api/classadmin/logout" to="/classadmin/login" />
      </nav>
      {children}
    </>
  );
}
