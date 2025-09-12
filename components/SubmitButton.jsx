// reusable submit button component that can be used in forms
// it will show a loading spinner when the form is submitting

'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';


// update later to use cursor-pointer classname instead of the props
export function SubmitButton({ children, disabled, pendingText = 'Submitting...', isPending = false, ...props }) {
    const { pending: formPending } = useFormStatus();

    const pending = formPending || isPending;

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
            className='cursor-pointer'
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