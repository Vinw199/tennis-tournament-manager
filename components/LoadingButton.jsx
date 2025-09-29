"use client";

import { useFormStatus } from 'react-dom';
import { Button } from './ui/Button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingButton({
    children,
    disabled,
    pendingText = 'Submitting...',
    isPending = false,
    variant = "default", // Default to primary button style
    size,
    className,
    ...props
}) {
    const { pending: formPending } = useFormStatus();
    const pending = formPending || isPending;

    return (
        <Button
            variant={variant}
            size={size}
            type="submit"
            disabled={pending || disabled}
            className={cn(className)}
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