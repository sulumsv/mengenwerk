import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const schrift = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MengenWerk",
  description: "Mengenermittlung aus Bauplänen. Automatisch erkannt, nachvollziehbar gerechnet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${schrift.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-fg">{children}</body>
    </html>
  );
}
