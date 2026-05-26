export const dynamic = "force-dynamic";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getSettings, listClasses } from "@/lib/data";

export default async function RegHomePage() {
  const [settings, classes] = await Promise.all([getSettings(), listClasses()]);
  return (
    <main className="container">
      <div className="card grid">
        <h1>{APP_NAME}</h1>
        <p>学生报名入口</p>
        {!settings.registrationOpen && <div className="notice">当前报名入口已关闭。已登记学生可以继续查询报名信息，但不能新增或修改。</div>}
        {classes.length === 0 && <div className="notice">管理员尚未创建班级。请先联系管理员创建班级后再填写报名信息。</div>}
        <div className="actions">
          {settings.registrationOpen && classes.length > 0 && <Link className="button" href="/reg/new">填写/修改报名信息</Link>}
          <Link className="button secondary" href="/reg/info">查询报名信息</Link>
          <Link className="button secondary" href="/reg/guide">报名操作指南</Link>
          <Link className="button secondary" href="/reg/payment-guide">缴费指南</Link>
        </div>
        <p style={{ color: 'red' }}>注意：因原考试时间与端午节冲突，考试时间改为6月27日、6月28日，具体考试安排以准考证为主</p>
      </div>
    </main>
  );
}
