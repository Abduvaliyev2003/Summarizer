import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ToastContainer } from '@/components/Toast';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="relative bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950"
            >
                {/* Background decoration matching Welcome page */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
                    <div className="absolute -left-40 top-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
                </div>

                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="relative z-10 flex-1">{children}</div>
            </AppContent>
            <ToastContainer />
        </AppShell>
    );
}
