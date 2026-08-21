// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
            <Head title="Forgot password" />

            {status && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <form onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-bold text-slate-700 dark:text-slate-200">
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="off"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="h-11 rounded-xl border-slate-200 bg-white/80 px-4 shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-slate-950/30"
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="my-6 flex items-center justify-start">
                        <Button
                            className="h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {!processing && <Mail className="h-4 w-4" />}
                            Email password reset link
                        </Button>
                    </div>
                </form>

                <div className="space-x-1 text-center text-sm text-slate-500 dark:text-slate-400">
                    <span>Or, return to</span>
                    <TextLink href={route('login')} className="font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400">
                        log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
