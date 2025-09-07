// components/WelcomeDialog.jsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('invite_accepted') === 'true') {
      // Open the dialog
      setIsOpen(true)

      // Clean up the URL so the dialog doesn't reappear on refresh
      const newPath = window.location.pathname
      router.replace(newPath, { scroll: false })
    }
  }, [searchParams, router])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Welcome to the Club!</DialogTitle>
          <DialogDescription className="pt-2">
            Your player profile is now active. You can now view club events,
            track your match history, and connect with other members.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Button onClick={() => setIsOpen(false)} className="w-full cursor-pointer">
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}