import Link from "next/link";
import { StudentLookup } from "@/components/StudentLookup";

export default function RegistrationInfoPage() {
  return (
    <main className="container grid">
      <div className="actions no-print"><Link href="/reg">返回报名入口</Link></div>
      <h1>查询报名信息</h1>
      <StudentLookup />
    </main>
  );
}
