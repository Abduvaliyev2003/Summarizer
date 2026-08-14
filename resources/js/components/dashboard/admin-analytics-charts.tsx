import { SectionCard } from '@/components/ui/section-card';
import { MonthlyTrendItem } from '@/types';
import { BarChart3, Users } from 'lucide-react';

export function AdminAnalyticsCharts({ trend = [] }: { trend: MonthlyTrendItem[] }) {
    const maxUsers = Math.max(...trend.map((t) => t.users), 1);
    const maxPdfs = Math.max(...trend.map((t) => t.pdfs), 1);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* User Sign-ups 6 Months Bar Chart */}
            <SectionCard className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                            User Sign-ups (6 Months)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Monthly new user growth rate</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <Users className="h-4 w-4" />
                    </div>
                </div>

                <div className="mt-6 flex h-44 items-end gap-3 pt-6">
                    {trend.map((item, idx) => {
                        const heightPercent = Math.max(15, Math.round((item.users / maxUsers) * 100));
                        return (
                            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                    {item.users}
                                </span>
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full rounded-t-xl bg-gradient-to-t from-violet-600 to-purple-500 transition-all duration-500 hover:brightness-110"
                                        title={`${item.month}: ${item.users} new users`}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>

            {/* Document Processing Activity Chart */}
            <SectionCard className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                            PDF Summaries Activity
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Monthly documents processed</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                </div>

                <div className="mt-6 flex h-44 items-end gap-3 pt-6">
                    {trend.map((item, idx) => {
                        const heightPercent = Math.max(15, Math.round((item.pdfs / maxPdfs) * 100));
                        return (
                            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                    {item.pdfs}
                                </span>
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        style={{ height: `${heightPercent}%` }}
                                        className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-blue-500 transition-all duration-500 hover:brightness-110"
                                        title={`${item.month}: ${item.pdfs} summaries`}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </SectionCard>
        </div>
    );
}
