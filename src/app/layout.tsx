import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מפת מתמטיקה כיתתית",
  description: "מערכת מעקב מתמטיקה כיתתית לתלמידים ומורים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
