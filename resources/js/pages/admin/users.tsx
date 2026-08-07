import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FileText,
    Loader2,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';

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

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    pdf_limit: number;
    features: string[] | string;
    is_active: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    plan?: Plan;
    pdf_count: number;
    pdf_summaries_count: number;
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    plans?: Plan[];
    stats?: {
        totalUsers: number;
        activeSubscriptions: number;
        totalPdfsProcessed: number;
    };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

/* -------------------------------------------------------------------------- */
/*  Small reusable pieces                                                      */
/* -------------------------------------------------------------------------- */

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Users;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-4 rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-xl shadow-violet-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-900/10 dark:border-white/10 dark:bg-white/5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
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
                className="rounded-lg border border-violet-200 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
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

function Pagination({
    currentPage,
    lastPage,
    onNavigate,
}: {
    currentPage: number;
    lastPage: number;
    onNavigate: (page: number) => void;
}) {
    return (
        <nav className="flex items-center justify-between gap-4 px-6 py-4" aria-label="Users pagination">
            <button
                type="button"
                onClick={() => onNavigate(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
            </button>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Page {currentPage} of {lastPage}
            </p>
            <button
                type="button"
                onClick={() => onNavigate(currentPage + 1)}
                disabled={currentPage >= lastPage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 outline-none transition-colors hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
        </nav>
    );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminUsers({ users, plans, stats }: Props) {
    const [search, setSearch] = useState('');
    const [changingPlan, setChangingPlan] = useState<number | null>(null);

    const handleChangePlan = (userId: number, planId: number) => {
        if (!confirm("Are you sure you want to change this user's plan?")) return;

        setChangingPlan(userId);
        router.post(
            route('admin.update-user-plan', userId),
            { plan_id: planId },
            {
                preserveScroll: true,
                onFinish: () => {
                    setChangingPlan(null);
                },
            },
        );
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > users.last_page) return;
        router.get('/admin/users', { page, search }, { preserveScroll: true, preserveState: true });
    };

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users.data;
        return users.data.filter(
            (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
        );
    }, [search, users.data]);

    const totalUsers = stats?.totalUsers ?? users.total;
    const activeSubscriptions = stats?.activeSubscriptions ?? users.data.filter((u) => u.plan).length;
    const totalPdfsProcessed =
        stats?.totalPdfsProcessed ?? users.data.reduce((sum, u) => sum + (u.pdf_summaries_count ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Users - Admin Panel" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage all users and their subscription plans
                    </p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <StatCard icon={Users} label="Total Users" value={totalUsers} />
                    <StatCard icon={CreditCard} label="Active Subscriptions" value={activeSubscriptions} />
                    <StatCard icon={FileText} label="Total PDFs Processed" value={totalPdfsProcessed} />
                </div>

                {/* Search */}
                <div className="relative max-w-xs">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or email"
                        aria-label="Search users"
                        className="w-full rounded-xl border border-violet-100 bg-white/80 py-2.5 pr-3 pl-9 text-sm text-slate-700 shadow-sm outline-none backdrop-blur-xl transition-colors placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    />
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white/80 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-violet-100 bg-violet-50/60 dark:border-white/10 dark:bg-white/5">
                                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Current Plan
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Total PDFs
                                    </th>
                                    <th className="px-6 py-3 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-100 dark:divide-white/10">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                            No users match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const usagePercent = user.plan?.pdf_limit
                                            ? Math.min(100, Math.round((user.pdf_count / user.plan.pdf_limit) * 100))
                                            : 0;

                                        return (
                                            <tr
                                                key={user.id}
                                                className="transition-colors hover:bg-violet-50/50 dark:hover:bg-white/5"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                        {user.role === 'admin' && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                                                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <PlanCell
                                                        user={user}
                                                        plans={plans}
                                                        isChanging={changingPlan === user.id}
                                                        onChangePlan={(planId) => handleChangePlan(user.id, planId)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.plan ? (
                                                        <div className="w-32">
                                                            <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                {user.pdf_count} / {user.plan.pdf_limit}
                                                            </p>
                                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100 dark:bg-white/10">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 transition-all duration-500"
                                                                    style={{ width: `${usagePercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                        <FileText className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                                        {user.pdf_summaries_count}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                                        {formatDate(user.created_at)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users.last_page > 1 && (
                        <div className="border-t border-violet-100 dark:border-white/10">
                            <Pagination
                                currentPage={users.current_page}
                                lastPage={users.last_page}
                                onNavigate={goToPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}