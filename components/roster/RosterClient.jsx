// components/roster/RosterClient.jsx

'use client';

import { useState, useEffect, useActionState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import { deletePlayer } from '@/app/(with-sidebar)/roster/actions';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';

import { RosterEmptyState } from './RosterEmptyState';
import { PlayerForm } from './PlayerForm';

export function RosterClient({ initialPlayers, spaceId }) {
    const [showDialog, setShowDialog] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [playerToDelete, setPlayerToDelete] = useState(null);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

    const [deleteState, deleteAction] = useActionState(deletePlayer, null);

    function openAdd() {
        setEditingPlayer(null);
        setShowDialog(true);
    }

    function openEdit(player) {
        setEditingPlayer(player);
        setShowDialog(true);
    }

    useEffect(() => {
        if (deleteState?.isSuccess) {
            toast.success(deleteState.message);
            setPlayerToDelete(null);
            setIsAlertDialogOpen(false);
        } else if (deleteState?.message) {
            toast.error(deleteState.message);
            setPlayerToDelete(null);
            setIsAlertDialogOpen(false);
        }
    }, [deleteState]);

    const handleFormSuccess = useCallback(() => {
        setShowDialog(false);
        setEditingPlayer(null);
    }, []);

    return (
        <>
            <div className="absolute top-10 right-20 flex justify-end">
                <Button onClick={openAdd} className='cursor-pointer'>Add Player</Button>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="px-4 py-3">Name</TableHead>
                            <TableHead className="px-4 py-3">Skill Rank</TableHead>
                            <TableHead className="px-4 py-3">Age</TableHead>
                            <TableHead className="px-4 py-3">Gender</TableHead>
                            <TableHead className="px-4 py-3">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialPlayers.length === 0 ? (
                            <TableRow>
                                <TableCell className="px-4 py-3" colSpan={5}>
                                    <RosterEmptyState onAddPlayer={openAdd} />
                                </TableCell>
                            </TableRow>

                        ) : (
                            initialPlayers.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium px-4 flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={p.profile_picture_url} alt={p.name} />
                                            <AvatarFallback>
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{p.name}</span>
                                    </TableCell>
                                    <TableCell className="px-4">{p.default_skill_rank}</TableCell>
                                    <TableCell className="px-4">{p.age ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell className="px-4">{p.gender ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                    <TableCell className="px-4">
                                        {/* Actions Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(p)} className='cursor-pointer'>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                                    onClick={() => { setPlayerToDelete(p); setIsAlertDialogOpen(true); }} // This just opens the dialog
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='text-2xl font-bold pb-2'>{editingPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
                    </DialogHeader>
                    <PlayerForm
                        initial={editingPlayer}
                        spaceId={spaceId}
                        onFormSuccess={handleFormSuccess}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            <span className="font-bold"> {playerToDelete?.name}</span> and remove their data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                        <form action={deleteAction}>
                            <input type="hidden" name="id" value={playerToDelete?.id ?? ''} />
                            <DeleteSubmitButton />
                        </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// delete submit button for alert dialog
function DeleteSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending} className='cursor-pointer'>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                </>
            ) : (
                'Delete'
            )}
        </Button>
    );
}