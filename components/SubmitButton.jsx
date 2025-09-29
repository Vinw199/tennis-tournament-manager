// reusable submit button component that can be used in forms
// it will show a loading spinner when the form is submitting
// isPending is used when the form is not a form and is being used as a button

'use client';

import { useFormStatus } from 'react-dom';
// import { Button } from '@/components/ui/button';
import { Button } from './ui/Button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


// update later to use cursor-pointer classname instead of the props
export function SubmitButton({
    children, disabled, pendingText = 'Submitting...', isPending = false, className, ...props
}) {
    const { pending: formPending } = useFormStatus();

    const pending = formPending || isPending;

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
            className={cn('cursor-pointer', className)}
            {...props}
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {pendingText}
                </>
            ) : (
                children
            )}
        </Button>
    );
}