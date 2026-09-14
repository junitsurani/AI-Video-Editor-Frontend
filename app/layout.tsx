import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frame — Your AI Editing Studio",
  description:
    "Turn raw footage into social edits, cinematic stories, courses, and standout clips.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
