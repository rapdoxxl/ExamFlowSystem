"use client";

import { useState } from "react";
import { StatusDialog } from "@/components/StatusDialog";

export function LoginForm({ type }: { type: "admin" | "classadmin" }) {
  const [error, setError] = useState("");
  const [recoverError, setRecoverError] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [showRecover, setShowRecover] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const url = type === "admin" ? "/api/admin/login" : "/api/classadmin/login";
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({ ok: false, message: "登录请求失败，请稍后重试" }));
      if (!res.ok || !json.ok) {
        setError(json.message || "登录失败");
        return;
      }
    } catch {
      setError("登录请求失败，请检查网络后重试");
      return;
    }
    window.location.href = type === "admin" ? "/xxgcxy" : "/classadmin";
  }

  async function recoverPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoverError("");
    setRecoverMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/classadmin/recover-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({ ok: false, message: "找回失败，请稍后重试" }));
    if (!res.ok || !json.ok) {
      setRecoverError(json.message || "身份信息核验失败，请检查后重试");
      return;
    }
    setRecoverMessage(`新的查询密码：${json.data.queryPassword}。请立即保存，后续登录班级管理员后台需要使用该密码。`);
    setRecoveredPassword(json.data.queryPassword);
  }

  return (
    <>
      <form className="card grid" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        {type === "admin" ? (
          <>
            <label>管理员账号<input name="username" required autoComplete="username" /></label>
            <label>密码<input name="password" type="password" required autoComplete="current-password" /></label>
          </>
        ) : (
          <>
            <label>身份证号<input name="idNumber" required maxLength={18} /></label>
            <label>查询密码<input name="queryPassword" required maxLength={6} /></label>
          </>
        )}
        <div className="actions">
          <button>登录</button>
          {type === "classadmin" && <button type="button" className="secondary" onClick={() => setShowRecover((value) => !value)}>忘记查询密码</button>}
        </div>
      </form>
      {type === "classadmin" && showRecover && (
        <form className="card grid" onSubmit={recoverPassword}>
          <h2>找回查询密码</h2>
          {recoverMessage && <div className="success">{recoverMessage}</div>}
          {recoverError && <div className="error">{recoverError}</div>}
          <label>身份证号<input name="idNumber" required maxLength={18} /></label>
          <label>报名手机号<input name="phone" required maxLength={11} /></label>
          <div className="actions"><button>生成新的查询密码</button></div>
        </form>
      )}
      <StatusDialog onClose={() => setRecoveredPassword("")} open={Boolean(recoveredPassword)} title="查询密码已重置">
        <p>请立即保存新的查询密码，后续登录班级管理员后台需要使用该密码。</p>
        <div className="notice"><b>新的查询密码：{recoveredPassword}</b></div>
      </StatusDialog>
    </>
  );
}
