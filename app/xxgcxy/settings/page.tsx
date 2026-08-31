import { getSettings } from "@/lib/data";
import { AnnouncementEditor, PaymentQrUploadForm, SettingsSwitch, SubjectCreateForm, SubjectEditButtons } from "@/components/AdminActions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listSubjects } from "@/lib/subjects";

export default async function SettingsPage() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const [settings, subjects] = await Promise.all([getSettings(), listSubjects(true)]);
  const subjectCounts = new Map((await Promise.all(subjects.map(async (subject) => [
    subject.id,
    {
      submitted: await prisma.registration.count({ where: { subject: subject.name, status: "SUBMITTED" } }),
      total: await prisma.registration.count({ where: { subject: subject.name } })
    }
  ] as const))));
  return (
    <main className="container settings-page">
      <div className="settings-heading">
        <div>
          <h1>系统设置</h1>
          <p className="small">管理学生端展示、报名入口、缴费二维码和科目容量等关键配置。</p>
        </div>
        <span className={`status-badge ${settings.registrationOpen ? "status-approved" : "status-rejected"}`}>报名入口：{settings.registrationOpen ? "开启" : "关闭"}</span>
      </div>

      <section className="card settings-control-card">
        <div>
          <h2>报名控制</h2>
          <p className="small">关闭后学生可以查询报名信息，但不能新增或修改报名记录。</p>
        </div>
        <div className="settings-control-actions">
          <span className={`status-badge ${settings.registrationOpen ? "status-approved" : "status-rejected"}`}>当前：{settings.registrationOpen ? "开启" : "关闭"}</span>
          <SettingsSwitch open={settings.registrationOpen} />
        </div>
      </section>

      <section className="settings-display-section">
        <div className="settings-section-head">
          <div>
            <h2>学生端展示</h2>
            <p className="small">集中维护学生能直接看到的公告和缴费二维码。</p>
          </div>
        </div>
        <div className="settings-display-grid">
          <div className="card grid">
            <div className="settings-card-title">
              <h3>通知公告</h3>
              <p className="small">维护学生报名首页的醒目提醒，例如考试时间调整、材料准备要求等。</p>
            </div>
            <AnnouncementEditor announcement={settings.announcement || ""} />
          </div>
          <div className="card grid">
            <div className="settings-card-title">
              <h3>缴费二维码</h3>
              <p className="small">更新学生端“缴费指南”页面显示的建行商户缴费二维码。</p>
            </div>
            <PaymentQrUploadForm version={settings.updatedAt.getTime().toString()} />
          </div>
        </div>
      </section>

      <section className="card grid">
        <div className="settings-section-head">
          <div>
            <h2>科目管理</h2>
            <p className="small">可新增、编辑、停用或删除报考科目。共享限额组相同的科目共用一个容量，例如 CAD 中级和高级默认共用 320 人容量。</p>
          </div>
          <SubjectCreateForm />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>状态</th><th>科目名称</th><th>容量</th><th>共享限额组</th><th>报名人数</th><th>操作</th></tr></thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td><span className={`status-badge ${subject.enabled ? "status-approved" : "status-draft"}`}>{subject.enabled ? "启用" : "停用"}</span></td>
                  <td>{subject.name}</td>
                  <td>{subject.capacity}</td>
                  <td>{subject.quotaGroup ? `${subject.quotaGroupName || subject.quotaGroup}（${subject.quotaGroup}）` : "单科独立"}</td>
                  <td>
                    <b>{subjectCounts.get(subject.id)?.total || 0}</b>
                    <div className="small">已提交 {subjectCounts.get(subject.id)?.submitted || 0}</div>
                  </td>
                  <td><SubjectEditButtons subject={subject} used={subjectCounts.get(subject.id)?.total || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
