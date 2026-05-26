import Link from "next/link";
import { StudentRegistrationDetails } from "@/components/StudentRegistrationDetails";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function RegistrationInfoResultPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  if (!user?.registration) {
    return (
      <main className="container grid">
        <div className="actions no-print"><Link href="/reg">返回报名入口</Link></div>
        <h1>报名信息</h1>
        <div className="error">请先使用身份证号和查询密码查询报名信息。</div>
        <div className="actions"><Link className="button" href="/reg/info">去查询</Link></div>
      </main>
    );
  }

  const registration = await prisma.registration.findUnique({
    where: { id: user.registration.id },
    include: { class: true }
  });
  if (!registration) {
    return (
      <main className="container grid">
        <div className="actions no-print"><Link href="/reg">返回报名入口</Link></div>
        <h1>报名信息</h1>
        <div className="error">报名记录不存在，请重新查询。</div>
        <div className="actions"><Link className="button" href="/reg/info">重新查询</Link></div>
      </main>
    );
  }

  return (
    <main className="container grid">
      <div className="actions no-print">
        <Link href="/reg">返回报名入口</Link>
        <Link href="/reg/info">重新查询</Link>
      </div>
      <h1>报名信息</h1>
      <StudentRegistrationDetails registration={registration} open={settings.registrationOpen} />
    </main>
  );
}
