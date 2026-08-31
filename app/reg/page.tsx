export const dynamic = "force-dynamic";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { getSettings, listClasses } from "@/lib/data";

export default async function RegHomePage() {
  const [settings, classes] = await Promise.all([getSettings(), listClasses()]);
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e9edf5 100%)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "2rem",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          padding: "2.5rem 2rem",
        }}
      >
        {/* 标题区 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, margin: "0 0 0.25rem 0", color: "#1a1a2e" }}>
            {APP_NAME}
          </h1>
          <p style={{ fontSize: "1.2rem", fontWeight: 400, color: "#5a6a7e", margin: "0.5rem 0 0 0" }}>
            🎓 学生报名入口
          </p>
        </div>

        {/* 提示信息 */}
        <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {!settings.registrationOpen && (
            <div
              style={{
                backgroundColor: "#e6f7ed",
                borderLeft: "6px solid #28a745",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                fontSize: "1rem",
                color: "#155724",
                fontWeight: 500,
              }}
            >
              当前报名入口已关闭。已登记学生可以继续查询报名信息，但不能新增或修改。
            </div>
          )}
          {classes.length === 0 && (
            <div
              style={{
                backgroundColor: "#fff9e6",
                borderLeft: "6px solid #ffc107",
                padding: "1rem 1.25rem",
                borderRadius: "12px",
                fontSize: "1rem",
                color: "#856404",
                fontWeight: 500,
              }}
            >
              ⚠️ 管理员尚未创建班级。请先联系管理员创建班级后再填写报名信息。
            </div>
          )}
        </div>

        {/* 按钮组 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {settings.registrationOpen && classes.length > 0 && (
            <Link
              className="button primary"
              href="/reg/new"
              style={{
                display: "block",
                width: "100%",
                padding: "1rem",
                backgroundColor: "#2563eb",
                color: "#fff",
                borderRadius: "16px",
                fontSize: "1.1rem",
                fontWeight: 600,
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
              }}
            >
              📝 填写/修改报名信息
            </Link>
          )}
          <Link
            className="button secondary"
            href="/reg/info"
            style={{
              display: "block",
              width: "100%",
              padding: "1rem",
              backgroundColor: "transparent",
              color: "#1e293b",
              border: "2px solid #cbd5e1",
              borderRadius: "16px",
              fontSize: "1.1rem",
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            🔍 查询报名信息
          </Link>
          <Link
            className="button secondary"
            href="/reg/guide"
            style={{
              display: "block",
              width: "100%",
              padding: "1rem",
              backgroundColor: "transparent",
              color: "#1e293b",
              border: "2px solid #cbd5e1",
              borderRadius: "16px",
              fontSize: "1.1rem",
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            📖 报名操作指南
          </Link>
          <Link
            className="button secondary"
            href="/reg/payment-guide"
            style={{
              display: "block",
              width: "100%",
              padding: "1rem",
              backgroundColor: "transparent",
              color: "#1e293b",
              border: "2px solid #cbd5e1",
              borderRadius: "16px",
              fontSize: "1.1rem",
              fontWeight: 500,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            💳 缴费指南
          </Link>
        </div>

        {settings.announcement && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "2px solid #fecaca",
              borderRadius: "16px",
              padding: "1rem 1.25rem",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#991b1b", fontWeight: 700, fontSize: "1rem", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {settings.announcement}
            </p>
          </div>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8rem", color: "#94a3b8" }}>
          如有疑问，请联系教务处
        </div>
      </div>
    </main>
  );
}
