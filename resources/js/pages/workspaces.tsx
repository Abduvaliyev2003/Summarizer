import PdfChatModal from '@/components/PdfChatModal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FolderPlus, FileText, MessageSquare } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Summary = { id: number; filename: string; collection_id: number | null };
type Workspace = { id: number; name: string; summaries_count: number; summaries: Pick<Summary, 'id' | 'filename'>[] };
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }, { title: 'Workspaces', href: '/workspaces' }];

export default function Workspaces({ collections, summaries }: { collections: Workspace[]; summaries: Summary[] }) {
    const [name, setName] = useState('');
    const [active, setActive] = useState<Workspace | null>(null);
    const create = (event: FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        router.post('/workspaces', { name }, { onSuccess: () => setName('') });
    };
    return <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Document Workspaces" />
        <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
            <section className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-800 p-7 text-white shadow-xl">
                <p className="text-sm font-semibold text-violet-200">DOCUMENT WORKSPACE</p>
                <h1 className="mt-1 text-3xl font-bold">Bring related PDFs together.</h1>
                <p className="mt-2 max-w-2xl text-sm text-violet-100">Organize documents by project, class, or client, then ask one question across the whole workspace.</p>
                <form onSubmit={create} className="mt-5 flex max-w-md gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Biology Final" className="min-w-0 flex-1 rounded-xl border-0 px-4 py-2.5 text-sm text-slate-900 outline-none" /><Button type="submit" className="bg-white text-violet-700 hover:bg-violet-50"><FolderPlus className="mr-2 h-4 w-4" />Create</Button></form>
            </section>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collections.map((collection) => <article key={collection.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900 dark:text-white">{collection.name}</h2><p className="mt-1 text-xs text-slate-500">{collection.summaries_count} document{collection.summaries_count === 1 ? '' : 's'}</p></div><button onClick={() => setActive(collection)} disabled={!collection.summaries_count} className="rounded-xl bg-violet-600 p-2 text-white disabled:opacity-40"><MessageSquare className="h-4 w-4" /></button></div>
                    <div className="mt-4 space-y-2">{collection.summaries.map((summary) => <p key={summary.id} className="flex items-center gap-2 truncate text-xs text-slate-600 dark:text-slate-300"><FileText className="h-3.5 w-3.5 text-violet-500" />{summary.filename}</p>)}</div>
                </article>)}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="font-bold text-slate-900 dark:text-white">Add documents to a workspace</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{summaries.map((summary) => <label key={summary.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5"><span className="flex min-w-0 items-center gap-2 truncate"><FileText className="h-4 w-4 shrink-0 text-violet-500" />{summary.filename}</span><select value={summary.collection_id ?? ''} onChange={(e) => router.post(`/workspaces/summaries/${summary.id}`, { collection_id: e.target.value || null })} className="max-w-36 rounded-lg border-slate-200 bg-white text-xs dark:bg-slate-800"><option value="">No workspace</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>)}</div></section>
        </main>
        {active && <PdfChatModal show summary="" filename={`${active.name} workspace`} endpoint={`/workspaces/${active.id}/chat`} onClose={() => setActive(null)} />}
    </AppLayout>;
}
