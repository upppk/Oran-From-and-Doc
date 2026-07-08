import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "แบบฟอร์มต่างๆ | Oranit",
  description: "ระบบแบบฟอร์มต่างๆ บริษัท กระเบื้องโอฬาร จำกัด",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
