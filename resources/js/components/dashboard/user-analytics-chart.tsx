import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SectionCard } from '@/components/ui/section-card';
import { BarChart3 } from 'lucide-react';

interface Props {
    dailyTrend?: Array<{ day: string; count: number }>;
}

export function UserAnalyticsChart({ dailyTrend }: Props) {
    if (!dailyTrend || dailyTrend.length === 0) {
        return null;
    }

    return (
        <SectionCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Summary Activity</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Your PDF summarization trend this week</p>
                    </div>
                </div>
            </div>

            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="userColorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            name="Summaries"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#userColorCount)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </SectionCard>
    );
}
