import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Check,
    CreditCard,
    FileText,
    Folder,
    History,
    LayoutGrid,
    Loader2,
    Sparkles,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const [cancelling, setCancelling] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    const userNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Summarize',
            url: '/',
            icon: FileText,
        },
        {
            title: 'History',
            url: '/history',
            icon: History,
        },
        {
            title: 'Billing',
            url: '/billing',
            icon: CreditCard,
        },
    ];

    // admin navigation items
    const adminNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'All Users',
            url: '/admin/users',
            icon: Users,
        },
        {
            title: 'Billing',
            url: '/billing',
            icon: CreditCard,
        },
    ];

    const mainNavItems = isAdmin ? adminNavItems : userNavItems;

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            url: 'https://github.com/summarizer-ai/summarizer',
            icon: Folder,
        },
    ];

    const pdfCount = user?.pdf_count ?? 0;
    const pdfLimit = user?.plan?.pdf_limit ?? 0;
    const usagePercent = pdfLimit > 0 ? Math.min(100, Math.round((pdfCount / pdfLimit) * 100)) : 0;

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;

        setCancelling(true);
        router.post(
            '/subscription/cancel',
            {},
            {
                onSuccess: () => {
                    setCancelled(true);
                },
                onError: () => {
                    alert('Failed to cancel subscription');
                },
                onFinish: () => {
                    setCancelling(false);
                },
            },
        );
    };

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-violet-100/80 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {!isAdmin && user?.plan && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Current Plan</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div className="space-y-3 px-3 py-2">
                                {/* Plan badge + status */}
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm shadow-violet-600/20">
                                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                                        {user.plan.name}
                                    </span>
                                    {!cancelled ? (
                                        <span className="text-[11px] font-medium text-emerald-500">Active</span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-rose-500">Cancelled</span>
                                    )}
                                </div>

                                {/* Usage bar */}
                                {pdfLimit > 0 && (
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                            <span>Documents used</span>
                                            <span>
                                                {pdfCount} / {pdfLimit}
                                            </span>
                                        </div>
                                        <div
                                            className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-white/10"
                                            role="progressbar"
                                            aria-valuenow={usagePercent}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label="Document usage this billing cycle"
                                        >
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 transition-all duration-500"
                                                style={{ width: `${usagePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-1">
                                    <Link
                                        href="/billing"
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-violet-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-violet-400 dark:hover:bg-white/10"
                                    >
                                        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                                        Manage billing
                                    </Link>

                                    {!cancelled ? (
                                        <button
                                            type="button"
                                            onClick={handleCancelSubscription}
                                            disabled={cancelling}
                                            aria-busy={cancelling}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 outline-none transition-colors hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                                        >
                                            {cancelling ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                                    Cancelling&hellip;
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                                    Cancel subscription
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                                            Subscription cancelled
                                        </p>
                                    )}
                                </div>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
