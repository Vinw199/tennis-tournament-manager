'use client';

import { useActionState, useEffect } from 'react';
import { renameSpace } from '@/lib/supabase/spaces';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState = { message: null, isSuccess: false };

function RenameSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className='cursor-pointer'>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save changes
    </Button>
  );
}

export function RenameSpaceModal({ space, isOpen, onOpenChange }) {
  const [renameState, renameAction] = useActionState(renameSpace, initialState);

  useEffect(() => {
    if (renameState.message) {
      if (renameState.isSuccess) {
        toast.success(renameState.message);
        onOpenChange(false);
      } else {
        toast.error(renameState.message);
      }
    }
  }, [renameState, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename "{space.name}"</DialogTitle>
          <DialogDescription>
            Make changes to your space name here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form action={renameAction}>
          <div className="py-4 space-y-2">
            <Label htmlFor="name">Space Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={space.name}
              required
            />
            <input type="hidden" name="spaceId" value={space.id} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className='cursor-pointer'>
                Cancel
              </Button>
            </DialogClose>
            <RenameSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}