'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { InvitationEmail } from '@/components/emails/InvitationEmail';

const ROSTER_PATH = '/roster';

/**
 * Checks if the currently authenticated user is an admin of the specified space.
 * @param {object} supabase - The Supabase client instance.
 * @param {string} spaceId - The ID of the space to check.
 * @returns {Promise<boolean>} - True if the user is an admin, false otherwise.
 */
async function isAdmin(supabase, spaceId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
        .from('space_members')
        .select('role')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single();

    if (error || !data) return false;
    return data.role === 'admin';
}

/**
 * Orchestrates creating/updating players and managing their invitations.
 * This function is the primary handler for the "Add/Edit Player" form.
 */
export async function handlePlayerForm(prevState, formData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { isSuccess: false, message: 'Authentication required.' };
    }

    // Extract data from the form
    const playerId = formData.get('id');
    const spaceId = formData.get('spaceId');
    const newEmail = formData.get('email')?.trim() || null;

    // Security Check: Verify user is an admin for this space.
    if (!await isAdmin(supabase, spaceId)) {
        return { isSuccess: false, message: 'Unauthorized: You do not have permission to manage players in this space.' };
    }

    // TODO: Wrap the entire create/update logic in a database transaction (RPC)
    // to ensure atomicity, as recommended in the plan.

    let successMessage = '';

    try {
        if (playerId) {
            // --- UPDATE LOGIC ---
            const { data: existingPlayer, error: fetchError } = await supabase
                .from('players')
                .select('user_id, invites (*)')
                .eq('id', playerId)
                .single();

            if (fetchError) throw new Error(`Failed to fetch player data: ${fetchError.message}`);

            // Prepare player data, respecting ownership rules from the plan.
            const playerData = {
                // Admin cannot change the name if the profile is claimed by a user.
                ...(existingPlayer.user_id ? {} : { name: formData.get('name') }),
                default_skill_rank: Number(formData.get('rank')),
                age: formData.get('age') ? Number(formData.get('age')) : null,
                gender: formData.get('gender') || null,
                profile_picture_url: formData.get('profile_picture_url') || null,
            };

            const { error: updateError } = await supabase.from('players').update(playerData).eq('id', playerId);
            if (updateError) throw new Error(`Failed to update player: ${updateError.message}`);

            // --- Invitation Management Logic ---
            // Only manage invites if the player has NOT claimed their profile yet.
            if (!existingPlayer.user_id) {
                const currentInvite = existingPlayer.invites;

                if (newEmail && !currentInvite) {
                    console.log('Creating new invite');
                    // Create new invite
                    await createInvite(supabase, playerId, spaceId, newEmail, user.id);
                } else if (newEmail && currentInvite && newEmail !== currentInvite.invitee_email) {
                    // Update existing invite with a new email
                    await updateInvite(supabase, currentInvite.id, newEmail);
                } else if (!newEmail && currentInvite) {
                    // Cancel (delete) the invite if email is removed
                    await cancelInvite(supabase, currentInvite.id);
                }
            }

            successMessage = 'Player updated successfully.';

        } else {
            // --- CREATE LOGIC ---
            const playerData = {
                name: formData.get('name'),
                default_skill_rank: Number(formData.get('rank')),
                age: formData.get('age') ? Number(formData.get('age')) : null,
                gender: formData.get('gender') || null,
                profile_picture_url: formData.get('profile_picture_url') || null,
                space_id: spaceId,
            };

            const { data: newPlayer, error: createError } = await supabase
                .from('players')
                .insert(playerData)
                .select('id')
                .single();

            if (createError) throw new Error(`Failed to add player: ${createError.message}`);

            // If an email was provided, create an invitation for the new player.
            if (newEmail) {
                await createInvite(supabase, newPlayer.id, spaceId, newEmail, user.id);
            }
            successMessage = 'Player added successfully.';
        }
    } catch (error) {
        return { isSuccess: false, message: error.message };
    }


    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: successMessage };
}

/**
 * Deletes a player after checking permissions.
 * Prevents deletion if the player is linked to a user or has a pending invite.
 */
export async function deletePlayer(prevState, formData) {
    const supabase = await createClient();
    const playerId = formData.get('id');
    const spaceId = formData.get('spaceId'); // Assuming spaceId is passed in the form for security check

    if (!await isAdmin(supabase, spaceId)) {
        return { isSuccess: false, message: 'Unauthorized.' };
    }

    // Permission Check: Fetch player to check for user link or pending invites.
    const { data: player, error: fetchError } = await supabase
        .from('players')
        .select('user_id, invites(id)')
        .eq('id', playerId)
        .single();

    if (fetchError) {
        return { isSuccess: false, message: 'Error fetching player data.' };
    }

    if (player.user_id) {
        return { isSuccess: false, message: 'Cannot delete a player who has joined the space. You can only remove them.' };
    }
    if (player.invites) {
        return { isSuccess: false, message: 'Cannot delete a player with a pending invitation. Please revoke the invite first.' };
    }

    const { error: deleteError } = await supabase.from('players').delete().eq('id', playerId);

    if (deleteError) {
        return { isSuccess: false, message: `Error deleting player: ${deleteError.message}` };
    }

    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: 'Player deleted successfully.' };
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvite(prevState, formData) {
    const supabase = await createClient();
    const inviteId = formData.get('inviteId');
    const spaceId = formData.get('spaceId');

    if (!await isAdmin(supabase, spaceId)) {
        return { isSuccess: false, message: 'Unauthorized.' };
    }

    try {
        await cancelInvite(supabase, inviteId);
    } catch (error) {
        return { isSuccess: false, message: error.message };
    }

    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: 'Invitation has been revoked.' };
}

/**
 * Resends a pending invitation.
 */
export async function resendInvite(prevState, formData) {
    const supabase = await createClient();
    const inviteId = formData.get('inviteId');
    const spaceId = formData.get('spaceId');

    if (!await isAdmin(supabase, spaceId)) {
        return { isSuccess: false, message: 'Unauthorized.' };
    }

    try {
        // Calling updateInvite without a new email will refresh the timestamps
        await updateInvite(supabase, inviteId);
    } catch (error) {
        return { isSuccess: false, message: error.message };
    }

    revalidatePath(ROSTER_PATH);
    return { isSuccess: true, message: 'Invitation has been resent.' };
}

// --- Invitation Helper Functions ---

async function createInvite(supabase, playerId, spaceId, email, inviterId) {
    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

    const { error } = await supabase.from('invites').insert({
        player_id: playerId,
        space_id: spaceId,
        invitee_email: email,
        invited_by: inviterId,
        token,
        expires_at,
    });
    if (error) throw new Error(`Failed to create invitation: ${error.message}`);
    // TODO: Send invitation email with the generated token.
    await sendInvitationEmail(supabase, {
        token: token,
        spaceId: spaceId,
        inviteeEmail: email,
        inviterId: inviterId
    });
}

async function updateInvite(supabase, inviteId, newEmail = null) {
    const { data: existingInvite, error: fetchError } = await supabase
        .from('invites')
        .select('invitee_email, token, space_id, invited_by')
        .eq('id', inviteId)
        .single();
    if (fetchError) throw new Error(`Failed to fetch invite for update: ${fetchError.message}`);

    const emailToSendTo = newEmail || existingInvite.invitee_email;

    const { error } = await supabase
        .from('invites')
        .update({
            invitee_email: emailToSendTo,
            created_at: new Date().toISOString(), // Refresh timestamps
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', inviteId);
    if (error) throw new Error(`Failed to update invitation: ${error.message}`);
    // Send updated invitation email.
    await sendInvitationEmail(supabase, {
        token: existingInvite.token,
        spaceId: existingInvite.space_id,
        inviteeEmail: emailToSendTo,
        inviterId: existingInvite.invited_by
    });
}

async function cancelInvite(supabase, inviteId) {
    const { error } = await supabase.from('invites').delete().eq('id', inviteId);
    if (error) throw new Error(`Failed to cancel invitation: ${error.message}`);
}

/**
 * Links a user to a player profile.
 * This action is called from the user-facing welcome screen.
 * It performs several validation checks and then executes a database
 * transaction to ensure data integrity.
 */
export async function acceptInvite(prevState, formData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { isSuccess: false, message: 'You must be logged in to accept an invitation.' };
    }

    const token = formData.get('token');
    if (!token) {
        return { isSuccess: false, message: 'Invalid invitation link. Token is missing.' };
    }

    // Fetch invite details to get the space_id
    const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select(`
            space_id,
            player:players( name )
        `)
        .eq('token', token)
        .single();

    // Handle cases where the token is invalid or not found
    if (inviteError || !invite) {
        return { isSuccess: false, message: 'This invitation link is invalid or has expired.' };
    }

    try {
        // Supabase Edge Functions to handle transactions.
        // Call a database function named 'accept_invite_transaction'.
        const { error } = await supabase.rpc('accept_invite_transaction', {
            p_invite_token: token,
            p_user_id: user.id,
            p_user_email: user.email
        });

        if (error) {
            // The database function can return specific error messages.
            throw new Error(error.message);
        }

    } catch (error) {
        // The message will be whatever the database function returned, or a generic one.
        return { isSuccess: false, message: `Failed to accept invitation: ${error.message}` };
    }

    // Seed the new user's profile with the name from the players table
    await supabase.auth.updateUser({ data: { display_name: invite.player.name } });

    // On success, set the cookie to the one they were invited to and redirect to the main dashboard with a success flag
    // so the UI can show a one-time welcome message.

    // Set the cookie to the one they were invited to
    cookies().set('sb-space-id', invite.space_id);

    redirect('/?invite_accepted=true');
}

// function to send invitation email
async function sendInvitationEmail(supabase, { token, spaceId, inviteeEmail, inviterId }) {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // fetch the names of the space and the inviter
    const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('name')
        .eq('id', spaceId)
        .single();
    const { data: inviter, error: inviterError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', inviterId)
        .single();
    if (spaceError || inviterError) throw new Error(`Failed to fetch space or inviter: ${spaceError?.message || inviterError?.message}`);

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite/${token}`;
    try {
        await resend.emails.send({
            from: 'Club Onboarding <onboarding@resend.dev>',
            to: inviteeEmail,
            subject: `You've been invited to join ${space.name}`,
            react: InvitationEmail({
                inviteLink: inviteLink,
                spaceName: space.name,
                invitedBy: inviter.display_name || 'An Admin'
            })
        });
    } catch (error) {
        throw new Error(`Failed to send invitation email: ${error.message}`);
    }
}