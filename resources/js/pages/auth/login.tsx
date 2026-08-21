import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    [key: string]: any;
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-bold text-slate-700 dark:text-slate-200">
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="email@example.com"
                            className="h-11 rounded-xl border-slate-200 bg-white/80 px-4 shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-slate-950/30"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password" className="font-bold text-slate-700 dark:text-slate-200">
                                Password
                            </Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="ml-auto text-sm font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Password"
                            className="h-11 rounded-xl border-slate-200 bg-white/80 px-4 shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-slate-950/30"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember" name="remember" tabIndex={3} />
                        <Label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Remember me
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
                        tabIndex={4}
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {!processing && <LogIn className="h-4 w-4" />}
                        Log in
                    </Button>
                </div>

                <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account?{' '}
                    <TextLink href={route('register')} className="font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400" tabIndex={5}>
                        Sign up
                    </TextLink>
                </div>
            </form>

            {status && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
