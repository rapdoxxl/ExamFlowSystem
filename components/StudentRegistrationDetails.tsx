import { getReviewStatusClass, getStudentRegistrationStatusLabel } from "@/lib/reviewStatus";

type RegistrationDetails = {
  idNumber: string;
  name: string | null;
  studentNumber: string | null;
  gender: string | null;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  subject: string | null;
  status: string;
  reviewStatus: string;
  reviewReason: string | null;
  class?: { name: string; department?: string | null; grade?: string | null } | null;
};

function classLabel(item?: RegistrationDetails["class"]) {
  return item ? [item.department, item.grade, item.name].filter(Boolean).join("-") : "";
}

export function StudentRegistrationDetails({ registration, open }: { registration: RegistrationDetails; open: boolean }) {
  const statusLabel = getStudentRegistrationStatusLabel(registration.status, registration.reviewStatus);
  const statusClass = getReviewStatusClass(registration.status, registration.reviewStatus);
  return (
    <div className="card grid">
      <h2>报名信息</h2>
      {registration.status === "SUBMITTED" && registration.reviewStatus === "PENDING" && <div className="notice">报名信息已提交，当前正在等待管理员审核，请留意后续审核结果。</div>}
      {registration.status === "SUBMITTED" && registration.reviewStatus === "APPROVED" && <div className="success">报名信息已审核通过，当前状态为报名成功。</div>}
      {registration.status === "SUBMITTED" && registration.reviewStatus === "REJECTED" && <div className="error">审核未通过：{registration.reviewReason || "管理员未填写原因，请联系班级管理员或系统管理员。"}</div>}
      <table><tbody>
        <tr><th>姓名</th><td>{registration.name}</td></tr>
        <tr><th>身份证号</th><td>{registration.idNumber}</td></tr>
        <tr><th>性别</th><td>{registration.gender}</td></tr>
        <tr><th>出生日期</th><td>{registration.birthDate}</td></tr>
        <tr><th>学号</th><td>{registration.studentNumber || ""}</td></tr>
        <tr><th>班级</th><td>{classLabel(registration.class)}</td></tr>
        <tr><th>手机号</th><td>{registration.phone}</td></tr>
        <tr><th>家庭地址</th><td>{registration.address}</td></tr>
        <tr><th>报考科目</th><td>{registration.subject}</td></tr>
        <tr><th>报名状态</th><td><span className={`status-badge ${statusClass}`}>{statusLabel}</span></td></tr>
        {registration.status === "SUBMITTED" && registration.reviewStatus === "REJECTED" && <tr><th>不通过原因</th><td>{registration.reviewReason || ""}</td></tr>}
      </tbody></table>
      <div className="actions">
        {open ? <a className="button" href="/reg/new">修改报名信息</a> : <span className="notice">报名入口已关闭，不能修改。</span>}
        <a className="button secondary" href="/api/export/student/form" target="_blank">下载申报表</a>
      </div>
    </div>
  );
}
