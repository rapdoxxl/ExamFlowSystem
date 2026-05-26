import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card grid">
        <h1>{APP_NAME}</h1>
        <p>请选择入口。</p>
        <div className="actions">
          <Link className="button" href="/reg">学生报名入口</Link>
          <Link className="button secondary" href="/xxgcxy/login">系统管理员后台</Link>
          <Link className="button secondary" href="/classadmin/login">班级管理员后台</Link>
        </div>
      </div>
    </main>
  );
}
