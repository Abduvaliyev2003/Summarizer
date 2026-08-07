import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'History',
        href: '/history',
    },
];

export default function History() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="History" />

            <div className="p-4">
                <h1 className="text-2xl font-semibold">History</h1>
                <p className="mt-2 text-sm text-slate-600">Your document summary history appears here.</p>
            </div>
        </AppLayout>
    );
}
