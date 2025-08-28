'use client'

import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

const SubmitButton = ({ children, pendingText, disabled, pending, ...props }) => {

  return (
    <Button disabled={pending || disabled} {...props} >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {pendingText || 'Submitting...'}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export default SubmitButton