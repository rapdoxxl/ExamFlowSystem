"use client";

import { useState } from "react";
import { StatusDialog } from "@/components/StatusDialog";

export function StudentLookup() {
  const [error, setError] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const [showRecover, setShowRecover] = useState(false);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/student/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({ ok: false, message: "查询失败，请稍后重试" }));
    if (!res.ok || !json.ok) {
      setError(json.message || "查询失败");
      return;
    }
    window.location.href = "/reg/info/result";
  }

  async function recoverPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverError("");
    setRecoverMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/student/recover-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({ ok: false, message: "找回失败，请稍后重试" }));
    if (!res.ok || !json.ok) {
      setRecoverError(json.message || "身份信息核验失败，请检查后重试");
      return;
    }
    setRecoverMessage(`新的查询密码：${json.data.queryPassword}。请立即保存，后续查询或修改报名信息需要使用该密码。`);
    setRecoveredPassword(json.data.queryPassword);
  }

  return (
    <>
      <div className="grid">
        <form className="card grid" onSubmit={login}>
          {error && <div className="error">{error}</div>}
          <label>身份证号<input name="idNumber" required maxLength={18} /></label>
          <label>查询密码<input name="queryPassword" required maxLength={6} /></label>
          <div className="actions">
            <button>查询</button>
            <button type="button" className="secondary" onClick={() => setShowRecover((value) => !value)}>忘记查询密码</button>
          </div>
        </form>
        {showRecover && (
          <form className="card grid" onSubmit={recoverPassword}>
            <h2>找回查询密码</h2>
            {recoverMessage && <div className="success">{recoverMessage}</div>}
            {recoverError && <div className="error">{recoverError}</div>}
            <label>身份证号<input name="idNumber" required maxLength={18} /></label>
            <label>报名手机号<input name="phone" required maxLength={11} /></label>
            <div className="actions"><button>生成新的查询密码</button></div>
          </form>
        )}
      </div>
      <StatusDialog onClose={() => setRecoveredPassword("")} open={Boolean(recoveredPassword)} title="查询密码已重置">
        <p>请立即保存新的查询密码，后续查询或修改报名信息需要使用该密码。</p>
        <div className="notice"><b>新的查询密码：{recoveredPassword}</b></div>
      </StatusDialog>
    </>
  );
}
