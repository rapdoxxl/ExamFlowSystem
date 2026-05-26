import Link from "next/link";
import { StudentForm } from "@/components/StudentForm";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, listClasses } from "@/lib/data";

export default async function NewRegistrationPage() {
  const [classes, settings, user] = await Promise.all([listClasses(), getSettings(), getCurrentUser()]);
  const initial = user?.registration || undefined;
  return (
    <main className="container grid">
      <div className="actions no-print"><Link href="/reg">返回报名入口</Link></div>
      <h1>填写报名信息</h1>
      <StudentForm classes={classes} initial={initial} registrationOpen={settings.registrationOpen} />
    </main>
  );
}
