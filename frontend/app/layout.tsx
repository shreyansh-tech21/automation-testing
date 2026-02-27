import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoTestIQ – AI-Driven End-to-End Test Automation Platform",
  description: "AI-driven end-to-end test automation platform with self-healing locators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
