import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "StudyDrive", template: "%s · StudyDrive" },
  description: "Soukromá cesta k maturitě: termíny, postup a tempo.",
  applicationName: "StudyDrive",
  appleWebApp: { capable: true, title: "StudyDrive", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs">
      <body className="min-h-dvh bg-bg text-label antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
