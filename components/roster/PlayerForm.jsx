'use client';

import { useActionState, useEffect } from 'react';
import { handlePlayerForm } from '@/app/(with-sidebar)/roster/actions';
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function PlayerForm({ initial, spaceId, onFormSuccess }) {
    const [state, formAction] = useActionState(handlePlayerForm, null);

    useEffect(() => {
        if (state?.isSuccess) {
            toast.success(state.message);
            onFormSuccess(); // Close the dialog
        } else if (state?.message) {
            toast.error(state.message);
        }
    }, [state, onFormSuccess]);

    return (
        <form action={formAction} className="grid gap-3 md:grid-cols-2">
            {/* Hidden inputs for ID and spaceId */}
            {initial?.id && <input type="hidden" name="id" value={initial.id} />}
            <input type="hidden" name="spaceId" value={spaceId} />

            <div className="text-sm">
                <Label className="mb-1 block text-foreground/70">Name</Label>
                <input name="name" required defaultValue={initial?.name} className="w-full rounded-md border px-3 py-2" />
            </div>
            <div className="text-sm">
                <Label className="mb-1 block text-foreground/70">Skill Rank (1 - 10)</Label>
                <input name="rank" type="number" min={1} max={10} required defaultValue={initial?.default_skill_rank || 1} className="w-full rounded-md border px-3 py-2" />
            </div>
            <div className="text-sm">
                <Label className="mb-1 block text-foreground/70">Age</Label>
                <input name="age" type="number" min={0} defaultValue={initial?.age} className="w-full rounded-md border px-3 py-2" />
            </div>
            <label className="text-sm">
                <div className="mb-1 text-foreground/70">Gender</div>
                <select name="gender" defaultValue={initial?.gender} className="w-full rounded-md border px-3 py-2">
                    <option value="">—</option>
                    <option>F</option>
                    <option>M</option>
                    <option>Other</option>
                </select>
            </label>
            <div className="text-sm md:col-span-2">
                <Label className="mb-1 block text-foreground/70">Profile Picture URL (optional)</Label>
                <input name="profile_picture_url" defaultValue={initial?.profile_picture_url} className="w-full rounded-md border px-3 py-2" />
            </div>
            <div className="text-sm md:col-span-2">
                <Label className="mb-1 block text-foreground/70">Email Address</Label>
                <input
                    name="email"
                    type="email"
                    defaultValue={initial?.invites?.invitee_email ?? ''}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder={initial?.user_id ? "Email managed by user" : "Enter email to send invitation"}
                    // An admin cannot change the email of a confirmed member.
                    disabled={!!initial?.user_id}
                />

                {/* This is the new dynamic helper text logic */}
                {initial?.user_id ? (
                    <p className="text-xs text-muted-foreground mt-1">
                        This player has linked their account. Their email is managed by them.
                    </p>
                ) : initial?.invites ? (
                    <p className="text-xs text-amber-600 mt-1 font-semibold">
                        Note: Changing this email will resend the invitation. Clearing it will revoke the invitation.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                        Provide an email to send this player a personal invitation to join the space.
                    </p>
                )}
            </div>
            <div className="flex justify-end md:col-span-2">
                <SubmitButton />
            </div>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                </>
            ) : (
                'Save'
            )}
        </Button>
    );
}