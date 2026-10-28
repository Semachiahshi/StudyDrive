import { Suspense } from "react";
import { Sidebar, SidebarView, TabBar, TabBarView } from "@/components/app-nav";
import { OfflineBanner } from "@/components/offline-banner";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The nav is part of the static shell; only the active highlight streams in. */}
      <Suspense fallback={<SidebarView pathname={null} />}>
        <Sidebar />
      </Suspense>
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6 lg:px-10 lg:pb-16">
          <OfflineBanner />
          {children}
        </main>
      </div>
      <Suspense fallback={<TabBarView pathname={null} />}>
        <TabBar />
      </Suspense>
    </>
  );
}
