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
      <div className="app-content">
        <main className="@container mx-auto w-full max-w-5xl px-4 pb-28 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6 md:pb-16 lg:px-10">
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
