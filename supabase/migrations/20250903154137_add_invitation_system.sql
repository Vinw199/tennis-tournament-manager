-- Migration: Add Invitation System
-- This script adds the necessary tables, columns, and security policies
-- to support the multi-user invitation feature.

-- Step 1: Add the user_id column to the players table.
-- This column will be nullable and will link a player profile to an authenticated user.
ALTER TABLE public.players
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create the new 'invites' table.
-- This table will store and manage all pending and accepted invitations.
CREATE TABLE public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
    player_id UUID NOT NULL UNIQUE REFERENCES public.players(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,

    -- Ensure email is not empty
    CONSTRAINT invitee_email_check CHECK (char_length(invitee_email) > 0)
);

-- Add comments to the columns for clarity in the database schema.
COMMENT ON TABLE public.invites IS 'Stores and manages user invitations to join a space.';
COMMENT ON COLUMN public.invites.player_id IS 'UNIQUE constraint ensures a player can only have one pending invite at a time.';
COMMENT ON COLUMN public.invites.status IS 'Can be ''pending'', ''accepted'', or ''expired''.';
COMMENT ON COLUMN public.invites.token IS 'Secure, single-use token for accepting an invitation.';


-- Enable Row Level Security for the new invites table.
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance on frequently queried columns.
CREATE INDEX idx_invites_space_id ON public.invites(space_id);
CREATE INDEX idx_invites_player_id ON public.invites(player_id);
CREATE INDEX idx_invites_token ON public.invites(token);


-- Step 3: Add Row Level Security (RLS) Policies for the 'invites' table.
-- These policies are crucial for securing invitation data and ensuring
-- users can only access data they are permitted to see.

-- Policy 1: Admins can perform any action on invites within their own spaces.
CREATE POLICY "Admins can manage invites in their spaces"
ON public.invites
FOR ALL
USING (
    space_id IN (
        SELECT space_id FROM public.space_members
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policy 2: Authenticated users can view a specific pending invite.
-- This is necessary for the /accept-invite page to fetch invite details using a token,
-- which is then validated server-side.
CREATE POLICY "Users can view pending invites"
ON public.invites
FOR SELECT
TO authenticated
USING ( status = 'pending' );
