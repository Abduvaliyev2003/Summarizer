import { Pagination } from '@/components/ui/pagination';
import { SectionCard } from '@/components/ui/section-card';
import { StatCard } from '@/components/ui/stat-card';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatPrice } from '@/lib/format';
import { BreadcrumbItem, PaginatedResponse, Plan, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    CreditCard,
    FileText,
    Loader2,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'All Users',
        href: '/admin/users',
    },
];

interface Props {
    users: PaginatedResponse<User>;
    plans?: Plan[];
    stats?: {
        totalUsers: number;
        activeSubscriptions: number;
        totalPdfsProcessed: number;
    };
}

function PlanCell({
    user,
    plans,
    isChanging,
    onChangePlan,
}: {
    user: User;
    plans?: Plan[];
    isChanging: boolean;
    onChangePlan: (planId: number) => void;
}) {
    if (!plans || plans.length === 0) {
        return user.plan ? (
            <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.plan.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatPrice(user.plan.price)}/month</p>
            </div>
        ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No plan</p>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={user.plan?.id ?? ''}
                disabled={isChanging}
                onChange={(event) => onChangePlan(Number(event.target.value))}
                aria-label={`Change plan for ${user.name}`}
                className="rounded-lg border border-violet-200 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-hidden transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
                <option value="">No plan</option>
                {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatPrice(plan.price)}/mo
                    </option>
                ))}
            </select>
            {isChanging && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" aria-hidden="true" />}
        </div>
    );
}

export default function UsersIndex({ users, plans, stats }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [changingUserPlanId, setChangingUserPlanId] = useState<number | null>(null);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users.data;
        const q = searchQuery.toLowerCase();
        return users.data.filter(
            (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        );
    }, [users.data, searchQuery]);

    const handlePlanChange = (userId: number, newPlanId: number) => {
        setChangingUserPlanId(userId);
        router.post(
            `/admin/users/${userId}/change-plan`,
            { plan_id: newPlanId },
            {
                preserveScroll: true,
                onFinish: () => setChangingUserPlanId(null),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management - PDF Summarizer" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            User Management
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            View registered members, subscription plans, and document usage
                        </p>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <StatCard icon={Users} label="Total registered users" value={stats.totalUsers} accent="violet" />
                        <StatCard icon={CreditCard} label="Active subscriptions" value={stats.activeSubscriptions} accent="emerald" />
                        <StatCard icon={FileText} label="PDFs processed" value={stats.totalPdfsProcessed} accent="indigo" />
                    </div>
                )}

                <SectionCard className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-sm flex-1">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full rounded-xl border border-violet-200 bg-white/70 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-hidden transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
                                    <th className="pb-3 font-semibold">User</th>
                                    <th className="pb-3 font-semibold">Role</th>
                                    <th className="pb-3 font-semibold">Current Plan</th>
                                    <th className="pb-3 font-semibold">PDF Usage</th>
                                    <th className="pb-3 font-semibold">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="group">
                                            <td className="py-3.5">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {u.name}
                                                </div>
                                                <div className="text-[11px] text-slate-400">{u.email}</div>
                                            </td>
                                            <td className="py-3.5">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                                        u.role === 'admin'
                                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {u.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-3.5">
                                                <PlanCell
                                                    user={u}
                                                    plans={plans}
                                                    isChanging={changingUserPlanId === u.id}
                                                    onChangePlan={(planId) => handlePlanChange(u.id, planId)}
                                                />
                                            </td>
                                            <td className="py-3.5 font-medium text-slate-600 dark:text-slate-300">
                                                {u.pdf_count ?? 0} docs
                                            </td>
                                            <td className="py-3.5 text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(u.created_at)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            No users matching your search filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={users.current_page}
                        lastPage={users.last_page}
                        total={users.total}
                        perPage={users.per_page}
                        baseUrl="/admin/users"
                    />
                </SectionCard>
            </div>
        </AppLayout>
    );
}