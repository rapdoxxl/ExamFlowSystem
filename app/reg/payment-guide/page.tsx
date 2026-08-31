import Link from "next/link";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

const steps = [
  "微信扫描页面中的建行商户缴费二维码，进入缴费页面。",
  "找到对应的缴费项目，填写缴费金额。",
  "每科每人130元，具体金额自行计算。",
  "勾选项目，核对应缴费金额，下拉页面，填写带 * 号部分。",
  "姓名必须填写班级名称，有需要备注的内容请按页面要求填写。",
  "确认信息无误后完成缴费。"
];

export default async function PaymentGuidePage() {
  const settings = await getSettings();
  return (
    <main className="container grid">
      <div className="actions no-print">
        <Link href="/reg">返回报名入口</Link>
        <Link href="/reg/guide">报名操作指南</Link>
      </div>
      <section className="payment-guide-shell">
        <div className="payment-guide-copy">
          <h1>建行商户缴费指南</h1>
          <ol className="payment-step-list">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="notice">线上缴费成功后保留缴费成功截图备查即可，不需要另外提交发票。</div>
        </div>
        <div className="payment-qr-card">
          <img src={`/api/payment-qr?v=${settings.updatedAt.getTime()}`} alt="建行商户缴费二维码" />
        </div>
      </section>
    </main>
  );
}
