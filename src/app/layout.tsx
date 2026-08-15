import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyDrive",
  description: "Deterministic study system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}