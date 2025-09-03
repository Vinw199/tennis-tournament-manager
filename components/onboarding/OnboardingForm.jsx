'use client'

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { handleOnboarding } from "@/lib/supabase/spaces"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const initialState = {
    error: null,
}

// This component handles all the interactive parts.
// replace createSpace with handleOnboarding
export function OnboardingForm() {
    const [state, formAction] = useActionState(handleOnboarding, initialState)

    return (
        <form action={formAction} className="flex flex-col gap-4 w-full max-w-md">
            <FormFields />
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            {state?.success && <p className="text-sm text-green-500">{state.success}</p>}
        </form>
    )
}

// The child component for useFormStatus is still a great pattern.
function FormFields() {
    const { pending } = useFormStatus()
    return (
        <fieldset disabled={pending} className="space-y-4">
            <Label htmlFor="userName" className="text-sm text-foreground/70">Your Name</Label>
            <Input
                type="text" name="userName" placeholder="e.g., John Doe" required
                className="bg-white/10 border border-white/10 text-white placeholder:text-neutral-300 focus-visible:ring-yellow-300 focus-visible:border-yellow-300"
            />
            <Label htmlFor="spaceName" className="text-sm text-foreground/70">Space Name</Label>
            <Input
                type="text" name="spaceName" placeholder="e.g., Jorhat Sunday Socials" required
                className="bg-white/10 border border-white/10 text-white placeholder:text-neutral-300 focus-visible:ring-yellow-300 focus-visible:border-yellow-300"
            />
            <Button type="submit" className="w-full cursor-pointer bg-[#DFFF00] text-gray-900 hover:bg-[#DFFF00]/80">
                {pending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Club...
                    </>
                ) : (
                    "Create Club"
                )}
            </Button>
        </fieldset>
    )
}