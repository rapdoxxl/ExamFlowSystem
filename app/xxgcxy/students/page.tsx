import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ClassAdminButton, DeleteRegistrationButton, PaymentBulkActions, PaymentToggleButton, ReviewBulkActions, ReviewButtons, StudentEditButton } from "@/components/AdminActions";
import { ClassFilterCombobox } from "@/components/ClassFilterCombobox";
import { RegistrationHealthInline } from "@/components/RegistrationHealth";
import { requireRole } from "@/lib/auth";
import { buildClassDisplayName } from "@/lib/classes";
import { getAdminReviewStatusLabel, getPaymentStatusClass, getPaymentStatusLabel, getReviewStatusClass } from "@/lib/reviewStatus";

type StudentsPageProps = {
  searchParams?: Promise<{ q?: string; review?: string; payment?: string; classId?: string }>;
};

type ReviewFilter = "" | "pending" | "approved" | "rejected" | "draft";
type PaymentFilter = "" | "paid" | "unpaid";

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const params = await searchParams;
  const keyword = String(params?.q || "").trim();
  const filterValues = new Set(["pending", "approved", "rejected", "draft"]);
  const reviewFilter: ReviewFilter = filterValues.has(String(params?.review || "")) ? String(params?.review) as ReviewFilter : "";
  const paymentFilter: PaymentFilter = params?.payment === "paid" ? "paid" : params?.payment === "unpaid" ? "unpaid" : "";
  const classFilter = String(params?.classId || "").trim();
  const keywordFilter: Prisma.RegistrationWhereInput | undefined = keyword
    ? {
      OR: [
        { studentNumber: { contains: keyword } },
        { idNumber: { contains: keyword.toUpperCase() } },
        { phone: { contains: keyword } }
      ]
    }
    : undefined;
  const reviewFilters: Record<Exclude<ReviewFilter, "">, Prisma.RegistrationWhereInput> = {
    pending: { status: "SUBMITTED", reviewStatus: "PENDING" },
    approved: { status: "SUBMITTED", reviewStatus: "APPROVED" },
    rejected: { status: "SUBMITTED", reviewStatus: "REJECTED" },
    draft: { status: "DRAFT" }
  };
  const paymentFilters: Record<Exclude<PaymentFilter, "">, Prisma.RegistrationWhereInput> = {
    paid: { paymentStatus: "PAID" },
    unpaid: { paymentStatus: "UNPAID" }
  };
  function buildWhere(filter: ReviewFilter, payment: PaymentFilter = paymentFilter, nextClass = classFilter) {
    const conditions = [keywordFilter, nextClass ? { classId: nextClass } : undefined, filter ? reviewFilters[filter] : undefined, payment ? paymentFilters[payment] : undefined].filter(Boolean) as Prisma.RegistrationWhereInput[];
    return conditions.length > 0 ? { AND: conditions } : undefined;
  }
  function studentsHref(nextReview: ReviewFilter, nextKeyword = keyword, nextPayment: PaymentFilter = paymentFilter, nextClass = classFilter) {
    const query = new URLSearchParams();
    if (nextKeyword) query.set("q", nextKeyword);
    if (nextReview) query.set("review", nextReview);
    if (nextPayment) query.set("payment", nextPayment);
    if (nextClass) query.set("classId", nextClass);
    const queryString = query.toString();
    return `/xxgcxy/students${queryString ? `?${queryString}` : ""}`;
  }
  const [registrations, classes, totalCount, pendingCount, approvedCount, rejectedCount, draftCount, allPaymentCount, paidCount, unpaidCount] = await Promise.all([
    prisma.registration.findMany({ where: buildWhere(reviewFilter), include: { class: true, user: true }, orderBy: [{ class: { department: "asc" } }, { class: { grade: "desc" } }, { class: { name: "asc" } }, { createdAt: "desc" }] }),
    prisma.class.findMany({ orderBy: [{ department: "asc" }, { grade: "desc" }, { name: "asc" }] }),
    prisma.registration.count({ where: buildWhere("") }),
    prisma.registration.count({ where: buildWhere("pending") }),
    prisma.registration.count({ where: buildWhere("approved") }),
    prisma.registration.count({ where: buildWhere("rejected") }),
    prisma.registration.count({ where: buildWhere("draft") }),
    prisma.registration.count({ where: buildWhere(reviewFilter, "") }),
    prisma.registration.count({ where: buildWhere(reviewFilter, "paid") }),
    prisma.registration.count({ where: buildWhere(reviewFilter, "unpaid") })
  ]);
  const tabs: Array<{ value: ReviewFilter; label: string; count: number }> = [
    { value: "", label: "全部", count: totalCount },
    { value: "pending", label: "待审核", count: pendingCount },
    { value: "approved", label: "审核通过", count: approvedCount },
    { value: "rejected", label: "审核不通过", count: rejectedCount },
    { value: "draft", label: "草稿", count: draftCount }
  ];
  const currentTab = tabs.find((tab) => tab.value === reviewFilter) || tabs[0];
  const showSelection = registrations.length > 0;
  const showReviewBulk = reviewFilter === "pending" && registrations.some((item) => item.status === "SUBMITTED");
  return (
    <main className="container students-page">
      <header className="students-heading">
        <h1>考生管理</h1>
        <div className="students-summary">
          <span className="status-badge status-pending"><b>{pendingCount}</b> 待审核</span>
          <span className="status-badge status-paid"><b>{paidCount}</b> 已缴费</span>
          <span className="students-result-count">{totalCount} 名考生</span>
        </div>
      </header>
      <section className="students-filter-panel">
        <form className="students-search" action="/xxgcxy/students">
          {reviewFilter && <input type="hidden" name="review" value={reviewFilter} />}
          {paymentFilter && <input type="hidden" name="payment" value={paymentFilter} />}
          <label className="sr-only" htmlFor="student-keyword">查询考生</label>
          <input id="student-keyword" name="q" defaultValue={keyword} placeholder="输入学号、身份证号或手机号" />
          <ClassFilterCombobox
            value={classFilter}
            options={classes.map((item) => ({ id: item.id, name: item.name, department: item.department, grade: item.grade, label: buildClassDisplayName(item) }))}
          />
          <button>查询</button>
          {keyword && <a className="button secondary compact" href={studentsHref(reviewFilter, "", paymentFilter)}>清除关键词</a>}
          {(keyword || reviewFilter || paymentFilter || classFilter) && <a className="students-reset" href="/xxgcxy/students">重置筛选</a>}
        </form>
        <nav className="students-tabs" aria-label="审核状态筛选">
          {tabs.map((tab) => (
            <a key={tab.label} className={`students-tab${reviewFilter === tab.value ? " active" : ""}`} href={studentsHref(tab.value)}>
              <span>{tab.label}</span>
              <b>{tab.count}</b>
            </a>
          ))}
        </nav>
        <nav className="students-payment-filters" aria-label="缴费状态筛选">
          <span>缴费状态</span>
          <a className={paymentFilter === "" ? "active" : ""} href={studentsHref(reviewFilter, keyword, "")}>全部 {allPaymentCount}</a>
          <a className={paymentFilter === "paid" ? "active" : ""} href={studentsHref(reviewFilter, keyword, "paid")}>已缴费 {paidCount}</a>
          <a className={paymentFilter === "unpaid" ? "active" : ""} href={studentsHref(reviewFilter, keyword, "unpaid")}>未缴费 {unpaidCount}</a>
        </nav>
      </section>
      <section className="students-table-panel">
        <header className="students-table-heading">
          <div>
            <h2>{currentTab.label}考生</h2>
            <span className="small">{keyword ? `“${keyword}” 共匹配 ${registrations.length} 条` : `共 ${registrations.length} 条记录`}</span>
          </div>
          {showSelection && <div className="students-toolbar-actions">{showReviewBulk && <ReviewBulkActions />}<PaymentBulkActions /></div>}
        </header>
        <div className="table-scroll">
          <table className="students-table"><thead><tr>{showSelection && <th className="selection-column">选择</th>}<th>考生</th><th>身份信息</th><th>班级与科目</th><th>审核状态</th><th>缴费状态</th><th>照片</th><th>权限</th><th>操作</th></tr></thead><tbody>
          {registrations.map((item) => <tr key={item.id}>
            {showSelection && <td className="selection-column"><input className="student-row-checkbox" type="checkbox" value={item.id} aria-label={`选择${item.name || item.idNumber}`} /></td>}
            <td><strong className="student-name">{item.name || "未填写姓名"}</strong><span className="student-detail">{item.studentNumber || "未填写学号"}</span></td>
            <td><span className="student-identity">{item.idNumber}</span><span className="student-detail">{item.phone || "未填写手机号"}</span></td>
            <td><span className="student-class">{item.class ? buildClassDisplayName(item.class) : "未分配班级"}</span><span className="student-detail">{item.subject || "未选择科目"}</span></td>
            <td><span className={`status-badge ${getReviewStatusClass(item.status, item.reviewStatus)}`}>{getAdminReviewStatusLabel(item.status, item.reviewStatus)}</span>{item.reviewStatus === "REJECTED" && item.reviewReason && <div className="small">原因：{item.reviewReason}</div>}<RegistrationHealthInline registration={item} /></td>
            <td><span className={`status-badge ${getPaymentStatusClass(item.paymentStatus)}`}>{getPaymentStatusLabel(item.paymentStatus)}</span>{item.paymentStatus === "PAID" && item.paymentPaidAt && <span className="student-detail">{new Date(item.paymentPaidAt).toLocaleDateString("zh-CN")}</span>}</td>
            <td>{item.photoPath ? <img className="student-photo-preview" src={`/api/admin/registrations/photo?id=${encodeURIComponent(item.id)}`} alt={`${item.name || item.idNumber}电子照片`} loading="lazy" /> : <span className="small">未上传</span>}</td><td>{item.user.role === "CLASS_ADMIN" ? "班级管理员" : "学生"}</td>
            <td><div className="students-row-actions"><ReviewButtons id={item.id} status={item.status} reviewStatus={item.reviewStatus} /><PaymentToggleButton id={item.id} paymentStatus={item.paymentStatus} /><StudentEditButton registration={{ id: item.id, idNumber: item.idNumber, name: item.name, studentNumber: item.studentNumber, phone: item.phone, address: item.address, subject: item.subject, classId: item.classId, className: item.class ? buildClassDisplayName(item.class) : null }} classes={classes} /><ClassAdminButton id={item.id} isClassAdmin={item.user.role === "CLASS_ADMIN"} classId={item.classId} /><DeleteRegistrationButton id={item.id} idNumber={item.idNumber} name={item.name} isClassAdmin={item.user.role === "CLASS_ADMIN"} /></div></td>
          </tr>)}
          {registrations.length === 0 && <tr><td colSpan={showSelection ? 9 : 8} className="students-empty">没有找到匹配的考生。</td></tr>}
          </tbody></table>
        </div>
      </section>
    </main>
  );
}
