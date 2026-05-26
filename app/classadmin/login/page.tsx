import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function ClassAdminLoginPage() {
  return (
    <main className="container grid">
      <div className="actions"><Link href="/reg">学生入口</Link></div>
      <h1>班级管理员登录</h1>
      <LoginForm type="classadmin" />
    </main>
  );
}
