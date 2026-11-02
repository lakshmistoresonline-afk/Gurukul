import React from "react";
import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Gurukul AI — K-12 NCERT Learning Platform",
  description: "Next-Generation Class 5 NCERT AI Learning Companion",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F5F6F8] text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
