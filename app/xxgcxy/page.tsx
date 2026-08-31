import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { getSubjectQuotaUsed, listSubjectQuotas } from "@/lib/registrationQuota";
import { buildClassDisplayName } from "@/lib/classes";

const REVIEW_COLORS = {
  draft: "#64748b",
  pending: "#d97706",
  approved: "#16a34a",
  rejected: "#dc2626",
  submitted: "#2563eb"
};

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function barStyle(value: number, total: number, color: string): CSSProperties {
  return {
    "--bar-width": `${percent(value, total)}%`,
    "--bar-color": color
  } as CSSProperties;
}

function formatPercent(value: number, total: number) {
  return `${percent(value, total)}%`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildDonutGradient(items: Array<{ value: number; color: string }>) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return "#e2e8f0";
  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 360;
    cursor = end;
    return `${item.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default async function AdminHomePage() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const [settings, classes, registrations, quotas] = await Promise.all([
    getSettings(),
    prisma.class.count(),
    prisma.registration.findMany({
      select: {
        id: true,
        status: true,
        reviewStatus: true,
        subject: true,
        submittedAt: true,
        class: { select: { department: true, grade: true, name: true } }
      }
    }),
    listSubjectQuotas(prisma)
  ]);
  const quotaUsages = await Promise.all(quotas.map(async (quota) => ({ quota, used: await getSubjectQuotaUsed(prisma, quota) })));

  const total = registrations.length;
  const submittedRows = registrations.filter((item) => item.status === "SUBMITTED");
  const submitted = submittedRows.length;
  const pending = submittedRows.filter((item) => item.reviewStatus === "PENDING").length;
  const approved = submittedRows.filter((item) => item.reviewStatus === "APPROVED").length;
  const rejected = submittedRows.filter((item) => item.reviewStatus === "REJECTED").length;
  const reviewed = approved + rejected;
  const draft = Math.max(total - submitted, 0);

  const reviewFlow = [
    { label: "登记人数", value: total, color: REVIEW_COLORS.submitted, hint: "系统内全部报名记录" },
    { label: "已提交", value: submitted, color: REVIEW_COLORS.submitted, hint: `${formatPercent(submitted, total)} 提交率` },
    { label: "待审核", value: pending, color: REVIEW_COLORS.pending, hint: `${formatPercent(pending, submitted)} 占已提交` },
    { label: "报名成功", value: approved, color: REVIEW_COLORS.approved, hint: `${formatPercent(approved, submitted)} 占已提交` },
    { label: "审核不通过", value: rejected, color: REVIEW_COLORS.rejected, hint: `${formatPercent(rejected, submitted)} 占已提交` }
  ];

  const subjectMap = new Map<string, number>();
  const departmentMap = new Map<string, { total: number; submitted: number; approved: number; pending: number }>();
  const classPendingMap = new Map<string, { pending: number; submitted: number; approved: number }>();
  for (const item of registrations) {
    const subject = item.subject || "未选择科目";
    subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);

    const department = item.class?.department || "未分院系";
    const departmentStat = departmentMap.get(department) || { total: 0, submitted: 0, approved: 0, pending: 0 };
    departmentStat.total += 1;
    if (item.status === "SUBMITTED") departmentStat.submitted += 1;
    if (item.status === "SUBMITTED" && item.reviewStatus === "APPROVED") departmentStat.approved += 1;
    if (item.status === "SUBMITTED" && item.reviewStatus === "PENDING") departmentStat.pending += 1;
    departmentMap.set(department, departmentStat);

    if (item.status === "SUBMITTED") {
      const className = item.class ? buildClassDisplayName(item.class) : "未分班级";
      const classStat = classPendingMap.get(className) || { pending: 0, submitted: 0, approved: 0 };
      classStat.submitted += 1;
      if (item.reviewStatus === "PENDING") classStat.pending += 1;
      if (item.reviewStatus === "APPROVED") classStat.approved += 1;
      classPendingMap.set(className, classStat);
    }
  }

  const subjectItems = Array.from(subjectMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const topSubjectTotal = Math.max(...subjectItems.map((item) => item.value), 1);

  const departmentItems = Array.from(departmentMap.entries())
    .map(([label, stat]) => ({ label, ...stat }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const departmentTotalMax = Math.max(...departmentItems.map((item) => item.total), 1);

  const classPendingItems = Array.from(classPendingMap.entries())
    .map(([label, stat]) => ({ label, ...stat }))
    .filter((item) => item.pending > 0)
    .sort((a, b) => b.pending - a.pending || b.submitted - a.submitted)
    .slice(0, 8);

  const today = startOfDay(new Date());
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const count = submittedRows.filter((item) => item.submittedAt && item.submittedAt >= date && item.submittedAt < nextDate).length;
    return { label: formatDateLabel(date), count };
  });
  const trendMax = Math.max(...trendDays.map((item) => item.count), 1);

  const donutGradient = buildDonutGradient([
    { value: approved, color: REVIEW_COLORS.approved },
    { value: pending, color: REVIEW_COLORS.pending },
    { value: rejected, color: REVIEW_COLORS.rejected },
    { value: draft, color: REVIEW_COLORS.draft }
  ]);

  return (
    <main className="container dashboard-page">
      <div className="dashboard-title">
        <div>
          <h1>数据概览</h1>
          <p className="small">报名、审核和名额使用情况实时汇总。</p>
        </div>
        <span className={`status-badge ${settings.registrationOpen ? "status-approved" : "status-rejected"}`}>报名入口：{settings.registrationOpen ? "开启" : "关闭"}</span>
      </div>

      <div className="grid grid-3">
        <div className="stat"><b>{total}</b>登记人数</div>
        <div className="stat"><b>{submitted}</b>已提交人数</div>
        <div className="stat"><b>{pending}</b>待审核人数</div>
        <div className="stat"><b>{approved}</b>报名成功人数</div>
        <div className="stat"><b>{rejected}</b>审核不通过人数</div>
        <div className="stat"><b>{formatPercent(reviewed, submitted)}</b>审核完成率</div>
        {quotaUsages.map(({ quota, used }) => (
          <div className="stat" key={quota.key}><b>{used}/{quota.limit}</b>{quota.shortLabel}名额</div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="chart-panel">
          <div className="chart-title"><h2>审核进度</h2><span className="small">从登记到报名成功</span></div>
          <div className="bar-list">
            {reviewFlow.map((item) => (
              <div className="bar-row" key={item.label}>
                <div><strong>{item.label}</strong><span>{item.hint}</span></div>
                <div className="bar-track"><div className="bar-fill" style={barStyle(item.value, total, item.color)} /></div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-title"><h2>审核构成</h2><span className="small">当前报名状态占比</span></div>
          <div className="donut-wrap">
            <div className="donut" style={{ background: donutGradient }}>
              <div className="donut-center"><b>{submitted}</b><span>已提交</span></div>
            </div>
            <div className="legend-list">
              <span><i style={{ background: REVIEW_COLORS.approved }} />报名成功 {approved}</span>
              <span><i style={{ background: REVIEW_COLORS.pending }} />待审核 {pending}</span>
              <span><i style={{ background: REVIEW_COLORS.rejected }} />审核不通过 {rejected}</span>
              <span><i style={{ background: REVIEW_COLORS.draft }} />草稿 {draft}</span>
            </div>
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-title"><h2>报考科目分布</h2><span className="small">按登记人数统计</span></div>
          <div className="bar-list compact">
            {subjectItems.map((item) => (
              <div className="bar-row" key={item.label}>
                <div><strong>{item.label}</strong><span>{formatPercent(item.value, total)}</span></div>
                <div className="bar-track"><div className="bar-fill" style={barStyle(item.value, topSubjectTotal, REVIEW_COLORS.submitted)} /></div>
                <b>{item.value}</b>
              </div>
            ))}
            {subjectItems.length === 0 && <div className="small">暂无报名数据。</div>}
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-title"><h2>名额使用</h2><span className="small">提交后占用名额</span></div>
          <div className="quota-list">
            {quotaUsages.map(({ quota, used }) => (
              <div className="quota-item" key={quota.key}>
                <div className="chart-title"><strong>{quota.shortLabel}</strong><span className="small">剩余 {Math.max(quota.limit - used, 0)} 人</span></div>
                <div className="bar-track"><div className="bar-fill" style={barStyle(used, quota.limit, used >= quota.limit ? REVIEW_COLORS.rejected : REVIEW_COLORS.approved)} /></div>
                <div className="small">{used}/{quota.limit}，使用率 {formatPercent(used, quota.limit)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="chart-panel dashboard-span-2">
          <div className="chart-title"><h2>近 7 日提交趋势</h2><span className="small">按正式提交时间统计</span></div>
          <div className="trend-chart">
            {trendDays.map((item) => (
              <div className="trend-item" key={item.label}>
                <div className="trend-bar"><span style={{ height: `${Math.max(percent(item.count, trendMax), item.count > 0 ? 8 : 0)}%` }} /></div>
                <b>{item.count}</b>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-title"><h2>院系分布</h2><span className="small">最多显示前 8 个院系</span></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>院系</th><th>登记</th><th>已提交</th><th>待审核</th><th>报名成功</th></tr></thead>
              <tbody>
                {departmentItems.map((item) => (
                  <tr key={item.label}>
                    <td><div className="table-bar-label"><span>{item.label}</span><div className="bar-track"><div className="bar-fill" style={barStyle(item.total, departmentTotalMax, REVIEW_COLORS.submitted)} /></div></div></td>
                    <td>{item.total}</td>
                    <td>{item.submitted}</td>
                    <td>{item.pending}</td>
                    <td>{item.approved}</td>
                  </tr>
                ))}
                {departmentItems.length === 0 && <tr><td colSpan={5} className="small">暂无报名数据。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-title"><h2>待审核班级排行</h2><span className="small">优先处理这些班级</span></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>班级</th><th>待审核</th><th>已提交</th><th>报名成功</th></tr></thead>
              <tbody>
                {classPendingItems.map((item) => (
                  <tr key={item.label}><td>{item.label}</td><td>{item.pending}</td><td>{item.submitted}</td><td>{item.approved}</td></tr>
                ))}
                {classPendingItems.length === 0 && <tr><td colSpan={4} className="small">当前没有待审核考生。</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
