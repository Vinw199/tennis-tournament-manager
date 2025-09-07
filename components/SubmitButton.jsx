// reusable submit button component that can be used in forms
// it will show a loading spinner when the form is submitting

'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';


// update later to use cursor-pointer classname instead of the props
export function SubmitButton({ children, disabled, pendingText = 'Submitting...', ...props }) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
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