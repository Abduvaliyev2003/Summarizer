import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export interface Plan {
    id: number;
    name: string;
    slug: string;
    description?: string;
    pdf_limit: number;
    price: number;
    features?: string[] | string;
    is_active?: boolean;
    users_count?: number;
    active_subscribers_count?: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role?: string;
    pdf_count?: number;
    plan_id?: number | null;
    stripe_subscription_id?: string | null;
    subscription_ends_at?: string | null;
    plan?: Plan | null;
    pdfSummaries_count?: number;
    [key: string]: unknown;
}

export interface PdfSummary {
    id: number;
    user_id?: number;
    pdf_id?: number;
    filename: string;
    summary: string;
    target_language?: string;
    source_url?: string | null;
    is_shared?: boolean;
    share_token?: string | null;
    created_at: string;
    updated_at?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number;
    to?: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface UserStats {
    pdfCount: number;
    pdfLimit: number;
    planName: string;
    totalSummaries: number;
}

export interface MonthlyTrendItem {
    month: string;
    users: number;
    pdfs: number;
}

export interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalPdfs: number;
    monthlyRevenue?: number;
    usersThisMonth?: number;
    pdfsThisMonth?: number;
    userGrowthTrend?: number;
    plans: Plan[];
    monthlyTrend?: MonthlyTrendItem[];
    recentUsers?: User[];
}
