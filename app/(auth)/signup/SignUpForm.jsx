"use client";

import { useActionState } from 'react';
import Link from 'next/link';

import { signup } from '../actions';
import SignupFormFields from '@/components/auth/SignupFormFields';

const initialState = {
  error: null,
  message: null,
}

export default function SignupForm() {

  const [state, formAction] = useActionState(signup, initialState);

  return (
    <form className="space-y-4" action={formAction}>

      <SignupFormFields />

      {/* Error Message Display */}
      {state.error && (<p className="mt-4 text-center text-sm text-red-600">{state.error}</p>)}

      {/* Link to Login Page */}
      <div className="pt-2 text-center text-sm text-foreground/70">
        Already have an account? <Link href="/login" className="text-brand">Log in</Link>
      </div>
    </form>
  );
}