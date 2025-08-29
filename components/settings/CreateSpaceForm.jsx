'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createSpace } from '@/lib/supabase/spaces';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// This is the same as your old SettingsForm.jsx, just renamed for clarity.
export function CreateSpaceForm() {
  const [state, formAction] = useActionState(createSpace, null);

  return (
    <form action={formAction} className="flex items-center gap-4">
      <Input
        name="name"
        placeholder="Name for your new space..."
        required
        className="flex-grow"
      />
      <SubmitButton />
      {/* TODO: We will replace these simple text errors with toasts (pop-up notifications) later */}
      {state?.error && (
        <p className="text-sm text-red-500">{state.error.message}</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-36">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        'Create Space'
      )}
    </Button>
  );
}
