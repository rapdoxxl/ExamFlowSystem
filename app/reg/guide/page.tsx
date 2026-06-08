import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const steps = [
  {
    title: "进入学生报名入口",
    text: "打开报名入口后，先阅读照片要求。首次报名点击“填写/修改报名信息”，已经报名过的学生点击“查询报名信息”。",
    labels: ["填写/修改报名信息", "查询报名信息", "报名操作指南"]
  },
  {
    title: "填写基本信息",
    text: "依次填写姓名、身份证号、学号、院系、年级、班级、手机号、报考科目和家庭地址。身份证号填写后，系统会自动识别性别和出生日期。",
    labels: ["姓名", "身份证号", "学号", "班级", "手机号", "报考科目"]
  },
  {
    title: "保存草稿并保存查询密码",
    text: "点击“保存草稿”后，系统会弹窗显示 6 位查询密码。请立即记录，后续查询或修改报名信息需要使用“身份证号 + 查询密码”。",
    labels: ["保存成功", "查询密码：123456", "知道了"]
  },
  {
    title: "准备并上传电子照片",
    text: "照片必须是 JPG 格式，尺寸严格为 90px × 110px，大小不超过 20KB。正式提交前必须上传符合要求的电子照片。",
    labels: ["JPG", "90px × 110px", "不超过 20KB"]
  },
  {
    title: "正式提交报名信息",
    text: "确认所有信息无误且照片上传成功后，点击“正式提交”。提交成功后系统会跳转到报名信息页，状态显示为“待审核”，审核通过后显示“报名成功”。",
    labels: ["正式提交", "报名信息已提交", "报名状态：待审核"]
  },
  {
    title: "查询、修改或找回查询密码",
    text: "在查询页输入身份证号和查询密码即可查看报名信息。忘记查询密码时，可用身份证号和报名手机号生成新的查询密码。",
    labels: ["身份证号", "查询密码", "忘记查询密码", "报名手机号"]
  }
];

export default function StudentGuidePage() {
  return (
    <main className="container guide-page">
      <div className="actions no-print">
        <Link href="/reg">返回报名入口</Link>
        <span className="button secondary">可使用浏览器打印保存</span>
      </div>

      <section className="guide-hero">
        <div>
          <p className="small">学生版</p>
          <h1>{APP_NAME}报名操作指南</h1>
          <p>按下面步骤完成报名、保存查询密码、上传照片并正式提交。遇到问题时，可先保存草稿，再联系班级或系统管理员处理。</p>
          <div className="actions">
            <Link className="button" href="/reg/new">开始填写报名信息</Link>
            <Link className="button secondary" href="/reg/info">查询报名信息</Link>
          </div>
        </div>
        <div className="guide-cover" aria-hidden="true">
          <div className="guide-browser-bar"><span></span><span></span><span></span></div>
          <div className="guide-cover-title">报名流程</div>
          <div className="guide-flow">
            <span>填写信息</span>
            <span>保存密码</span>
            <span>上传照片</span>
            <span>正式提交</span>
          </div>
        </div>
      </section>

      <section className="guide-grid">
        {steps.map((step, index) => (
          <article className="guide-step" key={step.title}>
            <div className="guide-step-index">{index + 1}</div>
            <div className="guide-step-copy">
              <h2>{step.title}</h2>
              <p>{step.text}</p>
            </div>
            <div className="guide-shot" aria-label={`${step.title}示意图`}>
              <div className="guide-shot-top"></div>
              <div className="guide-shot-body">
                {step.labels.map((label) => <span key={label}>{label}</span>)}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="guide-tips">
        <h2>重要提醒</h2>
        <ul>
          <li>查询密码只在首次保存或找回时显示，请及时记录。</li>
          <li>草稿不会进入导出材料，正式提交后需等待管理员审核，审核通过后才显示“报名成功”。</li>
          <li>照片不符合尺寸、格式或大小要求时，系统会阻止正式提交。</li>
          <li>提交后如需修改，在报名入口开放期间可通过查询报名信息进入修改，修改后需重新留意审核结果。</li>
        </ul>
      </section>
    </main>
  );
}
