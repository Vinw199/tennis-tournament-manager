'use client';

import { useActionState, useEffect } from 'react';
import { resendInvite, revokeInvite } from '@/app/(with-sidebar)/roster/actions';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Mail, User, Crown } from 'lucide-react';

export function PlayerRow({ player, spaceId, onEdit, onDelete }) {

    const getStatus = () => {
        if (player.role === 'admin') {
            return {
                icon: <Crown className="w-5 h-5 text-blue-500" />,
                tooltip: "Club Administrator. This user has full permissions.",
                badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Admin</Badge>,
                canEdit: true,
                canDelete: false
            };
        }
        if (player.user_id) {
            return {
                icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
                tooltip: "A full member of the club. Their profile is linked to their personal account.",
                badge: <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Member</Badge>,
                canEdit: true,
                canDelete: false
            };
        }
        if (player.invites) {
            return {
                icon: <Mail className="w-5 h-5 text-amber-500" />,
                tooltip: `An invitation has been sent to ${player.invites.invitee_email}.`,
                badge: <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Invited</Badge>,
                canEdit: true,
                canDelete: false
            };
        }
        return {
            icon: <User className="w-5 h-5 text-gray-400" />,
            tooltip: "This player has not been invited yet. Select 'Edit' to grant them personal access.",
            badge: <Badge variant="outline">Placeholder</Badge>,
            canEdit: true,
            canDelete: true
        };
    };

    const { icon, tooltip, badge, canEdit, canDelete } = getStatus();

    const [resendState, resendAction] = useActionState(resendInvite, null);
    const [revokeState, revokeAction] = useActionState(revokeInvite, null);

    useEffect(() => {
        if (resendState?.isSuccess) toast.success(resendState.message);
        else if (resendState?.message) toast.error(resendState.message);
    }, [resendState]);

    useEffect(() => {
        if (revokeState?.isSuccess) toast.success(revokeState.message);
        else if (revokeState?.message) toast.error(revokeState.message);
    }, [revokeState]);

    return (
        <TableRow key={player.id}>
            <TableCell className="font-medium px-4 flex items-center gap-3">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>{icon}</TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-center p-3">
                            <p>{tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={player.profile_picture_url} alt={player.name} />
                    <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{player.name}</span>
            </TableCell>
            <TableCell className="px-4">{player.default_skill_rank}</TableCell>
            <TableCell className="px-4">{player.age ?? <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell className="px-4">{player.gender ?? <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell className="px-4">{badge}</TableCell>
            <TableCell className="px-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {player.invites && (
                            <>
                                <form action={resendAction} className="w-full">
                                    <input type="hidden" name="inviteId" value={player.invites.id} />
                                    <input type="hidden" name="spaceId" value={spaceId} />
                                    <button type="submit" className="w-full">
                                        <DropdownMenuItem className='cursor-pointer'>Resend Invite</DropdownMenuItem>
                                    </button>
                                </form>
                                <form action={revokeAction} className="w-full">
                                    <input type="hidden" name="inviteId" value={player.invites.id} />
                                    <input type="hidden" name="spaceId" value={spaceId} />
                                    <button type="submit" className="w-full">
                                        <DropdownMenuItem className='cursor-pointer'>Revoke Invite</DropdownMenuItem>
                                    </button>
                                </form>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {canEdit && <DropdownMenuItem onClick={() => onEdit(player)} className='cursor-pointer'>Edit</DropdownMenuItem>}
                        {canDelete ? (
                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer" onClick={() => onDelete(player)}>
                                Delete
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem disabled>Delete</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}