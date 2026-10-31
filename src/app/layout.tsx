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

// Old Safari (before 15.4, e.g. iPad Air 2 on iOS 12) has no cascade layers,
// so it drops every Tailwind rule, and lacks a few APIs the app uses. Such
// browsers get public/legacy.css (built by scripts/build-legacy-css.mjs) and
// public/legacy.js (polyfills), written in synchronously so the polyfills run
// before the app's scripts. The sidebar state is restored here too, before
// first paint. Plain ES5 so old Safari can run it.
const headScript = [
  "if(!window.CSSLayerBlockRule){document.write('<link rel=\"stylesheet\" href=\"/legacy.css\"><script src=\"/legacy.js\"><\\/script>')}",
  "try{if(localStorage.getItem('sidebar')==='collapsed')document.documentElement.setAttribute('data-sidebar','collapsed')}catch(e){}",
].join(";");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The service worker marks offline copies with a data-snapshot attribute.
    <html lang="cs" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-label antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
