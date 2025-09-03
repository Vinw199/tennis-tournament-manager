'use client';

import { useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setActiveSpace, deleteSpace } from '@/lib/supabase/spaces';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { RenameSpaceModal } from './RenameSpaceModal'; // Make sure you've renamed the file
import { MoreHorizontal, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const initialState = { message: null, isSuccess: false };

// This button is specific to the delete confirmation dialog
function DeleteSubmitButton({ isLastSpace }) {
    const { pending } = useFormStatus();
    return (
        <AlertDialogAction asChild>
            <Button
                type="submit"
                variant="destructive"
                disabled={pending || isLastSpace}
                className='cursor-pointer'
            >
                {pending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                    </>
                ) : (
                    'Delete this space'
                )}
            </Button>
        </AlertDialogAction>
    );
}

export function SpaceListItem({ space, isActive, isLastSpace }) {
    const [deleteState, deleteAction] = useActionState(deleteSpace, initialState);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const isAdmin = space.role === 'admin';

    return (
        <>
            <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
                <TableCell>
                    <div className="flex items-center gap-3">
                        <span className="font-medium">{space.name}</span>
                        <Badge variant="secondary" className="capitalize">
                            {space.role}
                        </Badge>
                    </div>
                </TableCell>

                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {isActive && <Badge variant="secondary">Active</Badge>}

                        {!isActive && (
                            <form action={setActiveSpace} className="m-0">
                                <input type="hidden" name="spaceId" value={space.id} />
                                <Button type="submit" variant="outline" size="sm" className='cursor-pointer'>
                                    Set as Active
                                </Button>
                            </form>
                        )}

                        {isAdmin && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsRenameModalOpen(true)} className='cursor-pointer'>
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                        onClick={() => setIsDeleteConfirmOpen(true)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </TableCell>
            </TableRow>

            {isAdmin && (
                <>
                    {/* 1. The Rename Modal */}
                    <RenameSpaceModal
                        space={space}
                        isOpen={isRenameModalOpen}
                        onOpenChange={setIsRenameModalOpen}
                    />

                    {/* 2. The Delete Confirmation Dialog */}
                    <AlertDialog
                        open={isDeleteConfirmOpen}
                        onOpenChange={setIsDeleteConfirmOpen}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the{' '}
                                    <strong>{space.name}</strong> space and all of its data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                <form action={deleteAction} className="m-0">
                                    <input type="hidden" name="spaceId" value={space.id} />
                                    <DeleteSubmitButton isLastSpace={isLastSpace} />
                                </form>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    );
}