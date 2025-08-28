"use client";

import { useActionState } from 'react';

import Link from 'next/link';

import { login } from '../actions';
import LoginFormFields from '@/components/auth/LoginFormFields';

const initialState = {
    error: null,
    message: null,
}

export default function LoginForm() {

    // useFormState hook
    const [state, formAction] = useActionState(login, initialState);

    return (
        <form className="space-y-4" action={formAction}>

            <LoginFormFields />           

            {/* Message/Error Display */}
            {state.error && (<p className="mt-4 text-center text-sm text-red-600">{state.error}</p>)}
            {state.message && (<p className="mt-4 text-center text-sm text-green-600">{state.message}</p>)}

            {/* Link to Signup Page */}
            <div className="pt-2 text-center text-sm text-foreground/70">
                Don&apos;t have an account? <Link href="/signup" className="text-brand">Sign up</Link>
            </div>
        </form>
    );
}