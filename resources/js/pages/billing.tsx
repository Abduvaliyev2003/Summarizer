import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Billing',
        href: '/billing',
    },
];

export default function Billing() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <div className="p-4">
                <h1 className="text-2xl font-semibold">Billing</h1>
                <p className="mt-2 text-sm text-slate-600">Manage your subscription and payment methods here.</p>
            </div>
        </AppLayout>
    );
}
