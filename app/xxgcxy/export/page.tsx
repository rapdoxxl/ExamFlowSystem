import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export default async function AdminExportPage() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="container grid">
      <h1>数据导出</h1>
      <div className="notice">导出内容仅包含审核通过并显示“报名成功”的考生；草稿、待审核和审核不通过记录不会进入导出文件。电子照片包内文件名使用考生身份证号。</div>
      <div className="card grid">
        <h2>全部数据</h2>
        <div className="actions">
          <a className="button" href="/api/export/admin/import-template">全部考生导入模板</a>
          <a className="button" href="/api/export/admin/payment">全部缴费报名表</a>
          <a className="button" href="/api/export/admin/photos">全部电子照片包</a>
          <a className="button" href="/api/export/admin/forms">全部申报表包</a>
          <a className="button secondary" href="/api/export/admin/all">全部报名数据总包</a>
        </div>
      </div>
      <div className="card grid">
        <h2>按班级导出</h2>
        <table><thead><tr><th>班级</th><th>操作</th></tr></thead><tbody>{classes.map((item) => <tr key={item.id}><td>{item.name}</td><td className="actions"><a href={`/api/export/admin/import-template?classId=${item.id}`}>导入模板</a><a href={`/api/export/admin/payment?classId=${item.id}`}>缴费表</a><a href={`/api/export/admin/photos?classId=${item.id}`}>照片包</a><a href={`/api/export/admin/forms?classId=${item.id}`}>申报表包</a><a href={`/api/export/admin/all?classId=${item.id}`}>总包</a></td></tr>)}</tbody></table>
      </div>
    </main>
  );
}
