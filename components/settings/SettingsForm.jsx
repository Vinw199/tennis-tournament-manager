'use client'

import { Input } from "../ui/input"
import { useActionState } from "react"
import { createSpace } from "@/lib/supabase/spaces"
import { useFormStatus } from "react-dom"
import { Button } from "../ui/Button"
import { Loader2 } from "lucide-react"

const SettingsForm = () => {
    const [state, formAction] = useActionState(createSpace, null)

    return (
        <form action={formAction} className="flex items-center gap-4">
            <Input
                name="name"
                placeholder="Name for your new space..."
                required
            />
            <SubmitButton />
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            {state?.success && <p className="text-sm text-green-500">{state.success}</p>}
        </form>
    )
}

export default SettingsForm

const SubmitButton = () => {
    const { pending } = useFormStatus()
    return (
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Space"
        )}
      </Button>
    )
  }