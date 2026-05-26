import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "校内专项职业能力考核在线报名系统"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">{children}</div>
        <footer className="site-footer no-print">信息工程学院专项职业能力考核在线报名系统v2026.1 by.xxl</footer>
      </body>
    </html>
  );
}
