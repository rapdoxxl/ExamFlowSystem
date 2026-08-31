import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "校内考试报名信息管理系统"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">{children}</div>
        <footer className="site-footer no-print">考试报名信息管理系统v2026.1 by.xxl</footer>
      </body>
    </html>
  );
}
