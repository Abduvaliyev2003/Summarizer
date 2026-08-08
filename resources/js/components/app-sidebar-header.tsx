import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-violet-100/80 bg-white/40 px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-white/10 dark:bg-slate-950/40 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
