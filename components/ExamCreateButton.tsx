"use client";

import { useState } from "react";

export function ExamCreateButton({ activeExamId }: { activeExamId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.activeExamId = activeExamId;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setError(result.message || "新建失败"); return; }
      window.location.href = "/xxgcxy/classes";
    } catch { setError("网络异常，请稍后重试"); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" onClick={() => { setError(""); setOpen(true); }}>新建考试</button>
    {open && <div className="modal-backdrop"><section className="modal-panel admin-modal" role="dialog" aria-modal="true" aria-labelledby="new-exam-title">
      <h2 id="new-exam-title">开始新一轮考试</h2>
      <p>当前考试将保留在历史记录中。新考试的班级、考生及名额占用从零开始，科目配置和缴费二维码继续保留；报名入口关闭，通知公告清空。</p>
      <form className="grid" onSubmit={submit}>
        <label>考试名称<input name="name" required minLength={2} maxLength={80} placeholder="例如：2027年上半年考试" autoFocus disabled={busy} /></label>
        <label>输入“开始新考试”确认<input name="confirmation" required pattern="开始新考试" disabled={busy} /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={() => setOpen(false)}>取消</button><button type="submit" disabled={busy}>{busy ? "正在创建" : "开始新考试"}</button></div>
      </form>
    </section></div>}
  </>;
}
