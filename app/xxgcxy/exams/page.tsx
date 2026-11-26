import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { database, getActiveExamId } from "@/lib/prisma";
import { ExamCreateButton } from "@/components/ExamCreateButton";
import { getStudentRegistrationStatusLabel } from "@/lib/reviewStatus";

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ examId?: string }> }) {
  if (!await requireRole(["SYSTEM_ADMIN"])) return <main className="container">无权限</main>;
  const activeId = await getActiveExamId();
  const exams = await database.exam.findMany({ orderBy: { createdAt: "desc" } });
  if (!exams.some((exam) => exam.id === "legacy")) exams.push({ id: "legacy", name: "历史考试（原有数据）", createdAt: new Date(0) });
  const counts = await Promise.all(exams.map(async (exam) => ({ ...exam,
    classes: await database.class.count({ where: { examId: exam.id } }),
    registrations: await database.registration.count({ where: { examId: exam.id } }),
    submitted: await database.registration.count({ where: { examId: exam.id, status: "SUBMITTED" } })
  })));
  const { examId } = await searchParams;
  const selected = exams.find((exam) => exam.id === examId);
  const records = selected ? await database.registration.findMany({ where: { examId: selected.id }, include: { class: true }, orderBy: { createdAt: "asc" } }) : [];
  return <main className="container grid">
    <div className="settings-heading"><div><h1>考试批次</h1><p>当前考试：{exams.find((exam) => exam.id === activeId)?.name}</p></div><ExamCreateButton activeExamId={activeId} /></div>
    <div className="table-scroll"><table><thead><tr><th>考试名称</th><th>状态</th><th>班级数</th><th>报名记录</th><th>已提交</th><th>操作</th></tr></thead><tbody>
      {counts.map((exam) => <tr key={exam.id}><td>{exam.name}</td><td>{exam.id === activeId ? "当前考试" : "历史存档"}</td><td>{exam.classes}</td><td>{exam.registrations}</td><td>{exam.submitted}</td><td><Link href={`/xxgcxy/exams?examId=${exam.id}`}>查看记录</Link></td></tr>)}
    </tbody></table></div>
    {selected && <section className="grid"><h2>{selected.name}</h2><div className="actions">
      <a className="button secondary" href={`/api/admin/exams/export?examId=${selected.id}&type=classes`}>导出班级清单</a>
      <a className="button" href={`/api/admin/exams/export?examId=${selected.id}`}>导出全部存档记录</a>
      <a className="button secondary" href={`/api/admin/exams/export?examId=${selected.id}&type=photos`}>导出审核通过照片</a>
      <a className="button secondary" href={`/api/admin/exams/export?examId=${selected.id}&type=all`}>导出正式材料总包</a>
    </div><div className="table-scroll"><table><thead><tr><th>姓名</th><th>学号</th><th>班级</th><th>科目</th><th>状态</th></tr></thead><tbody>{records.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.studentNumber}</td><td>{item.class?.name}</td><td>{item.subject}</td><td>{getStudentRegistrationStatusLabel(item.status, item.reviewStatus)}</td></tr>)}{!records.length && <tr><td colSpan={5}>暂无报名记录</td></tr>}</tbody></table></div></section>}
  </main>;
}
