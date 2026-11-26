"use client";

import { useState } from "react";

export function ExamSwitchButton({ examId, activeExamId, name }: { examId: string; activeExamId: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function switchExam() {
    if (!confirm(`切换到“${name}”？后台管理和学生报名入口将一起切换。请确认该批次的报名开关及公告。`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/exams", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId, activeExamId }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setError(result.message || "切换失败"); return; }
      window.location.href = "/xxgcxy/exams";
    } catch { setError("网络异常，请稍后重试"); }
    finally { setBusy(false); }
  }
  return <span><button type="button" className="compact secondary" disabled={busy} onClick={switchExam}>{busy ? "正在切换" : "切换到此批次"}</button>{error && <span className="field-error" role="alert">{error}</span>}</span>;
}
