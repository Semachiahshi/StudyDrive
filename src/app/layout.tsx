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

// Browsers without cascade layers (Safari before 15.4, e.g. iPad Air 2 on
// iOS 12) drop every Tailwind rule, so they get public/legacy.css instead,
// built by scripts/build-legacy-css.mjs. Plain ES5 so old Safari can run it.
const legacyStylesScript =
  "if(!window.CSSLayerBlockRule){var l=document.createElement('link');l.rel='stylesheet';l.href='/legacy.css';document.head.appendChild(l)}";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The service worker marks offline copies with a data-snapshot attribute.
    <html lang="cs" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: legacyStylesScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-label antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
