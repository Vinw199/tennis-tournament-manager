// components/acceptInvite/AcceptInviteForm.jsx

'use client';

import { useActionState } from 'react';
import { acceptInvite } from '@/app/(with-sidebar)/roster/actions';
import { SubmitButton } from '@/components/SubmitButton';

export function AcceptInviteForm({ token }) {

  const initialState = {
    message: null,
    isSuccess: false,
  };

  const [state, formAction] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="space-y-4 text-center w-full">
      <input type="hidden" name="token" value={token} />

      <SubmitButton
        children="Accept & Enter the Club"
        pendingText="Accepting..."
        className="cursor-pointer"
      />

      {state?.message && !state.isSuccess && (
        <div className="text-sm text-center text-red-600">
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}