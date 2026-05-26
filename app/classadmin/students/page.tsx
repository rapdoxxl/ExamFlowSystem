import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentToggleButton, StudentEditButton } from "@/components/AdminActions";
import { buildClassDisplayName } from "@/lib/classes";
import { getPaymentStatusClass, getPaymentStatusLabel, getStudentRegistrationStatusLabel, getReviewStatusClass } from "@/lib/reviewStatus";

export default async function ClassStudentsPage() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用班级管理员账号登录。</div></main>;
  if (!user.classId) return <main className="container"><div className="error">未绑定班级。</div></main>;
  const [registrations, classes] = await Promise.all([
    prisma.registration.findMany({ where: { classId: user.classId }, include: { class: true }, orderBy: { createdAt: "desc" } }),
    prisma.class.findMany({ where: { id: user.classId } })
  ]);
  return (
    <main className="container grid">
      <h1>本班考生</h1>
      <div className="card">
        <table><thead><tr><th>姓名</th><th>身份证号</th><th>学号</th><th>科目</th><th>审核状态</th><th>缴费状态</th><th>操作</th></tr></thead><tbody>
          {registrations.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.idNumber}</td><td>{item.studentNumber}</td><td>{item.subject}</td><td><span className={`status-badge ${getReviewStatusClass(item.status, item.reviewStatus)}`}>{getStudentRegistrationStatusLabel(item.status, item.reviewStatus)}</span>{item.reviewStatus === "REJECTED" && item.reviewReason && <div className="small">原因：{item.reviewReason}</div>}</td><td><span className={`status-badge ${getPaymentStatusClass(item.paymentStatus)}`}>{getPaymentStatusLabel(item.paymentStatus)}</span>{item.paymentStatus === "PAID" && item.paymentPaidAt && <div className="small">{new Date(item.paymentPaidAt).toLocaleDateString("zh-CN")}</div>}</td><td className="actions"><PaymentToggleButton id={item.id} paymentStatus={item.paymentStatus} api="/api/classadmin/registrations" /><StudentEditButton registration={{ id: item.id, idNumber: item.idNumber, name: item.name, studentNumber: item.studentNumber, phone: item.phone, address: item.address, subject: item.subject, classId: item.classId, className: item.class ? buildClassDisplayName(item.class) : null }} classes={classes} api="/api/classadmin/registrations" /></td></tr>)}
        </tbody></table>
      </div>
    </main>
  );
}
