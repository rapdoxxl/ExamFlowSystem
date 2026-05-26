import { getSettings } from "@/lib/data";
import { SettingsSwitch } from "@/components/AdminActions";
import { requireRole } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireRole(["SYSTEM_ADMIN"]);
  if (!user) return <main className="container"><div className="error">无权限，请使用系统管理员账号登录。</div></main>;
  const settings = await getSettings();
  return (
    <main className="container grid">
      <h1>系统设置</h1>
      <div className="card grid">
        <p>报名入口当前状态：<b>{settings.registrationOpen ? "开启" : "关闭"}</b></p>
        <p className="small">关闭后学生可以查询，但不能新增或修改报名信息。</p>
        <div className="actions"><SettingsSwitch open={settings.registrationOpen} /></div>
      </div>
    </main>
  );
}
