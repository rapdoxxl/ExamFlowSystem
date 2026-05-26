import { requireRole } from "@/lib/auth";

export default async function ClassExportPage() {
  const user = await requireRole(["CLASS_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用班级管理员账号登录。</div></main>;
  return (
    <main className="container grid">
      <h1>本班数据导出</h1>
      <div className="notice">导出内容仅包含审核通过并显示“报名成功”的考生；草稿、待审核和审核不通过记录不会进入导出文件。电子照片包内文件名使用考生身份证号。</div>
      <div className="card grid">
        <p>导出内容仅包含当前班级数据。</p>
        <div className="actions">
          <a className="button" href="/api/export/classadmin/import-template">考生导入模板</a>
          <a className="button" href="/api/export/classadmin/payment">缴费报名表</a>
          <a className="button" href="/api/export/classadmin/photos">电子照片包</a>
          <a className="button" href="/api/export/classadmin/forms">申报表包</a>
          <a className="button secondary" href="/api/export/classadmin/all">本班总包</a>
        </div>
      </div>
    </main>
  );
}
