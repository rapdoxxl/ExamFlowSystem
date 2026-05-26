"use client";

export function LogoutButton({ api, to }: { api: string; to: string }) {
  async function logout() {
    await fetch(api, { method: "POST" });
    window.location.href = to;
  }
  return <button className="secondary" onClick={logout}>退出登录</button>;
}
