// app/accept-invite/[token]/page.jsx

import { createClient } from '@/utils/supabase/server';
import { AcceptInviteForm } from '@/components/acceptInvite/AcceptInviteForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { XCircle } from "lucide-react"
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// shared layout component
function PageLayout({ children }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="w-full max-w-lg space-y-6">
                <div className="text-center">
                    {/* Replace this with your actual app name or SVG logo */}
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Tennis Tournament Manager
                    </h1>
                </div>
                <Card>
                    {children}
                </Card>
            </div>
        </div>
    );
}

// component to render an error message
function InvalidInvite() {
    return (
        <>
            <CardHeader className="items-center text-center">
                {/* A clear icon for the error state */}
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <CardTitle className="text-2xl pt-4">
                    Invitation Invalid
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                    This invitation link may be incorrect, expired, or have already been used. Please contact the club administrator and ask for a new invitation.
                </p>
            </CardContent>
            <CardFooter>
                {/* A clear action to guide the user */}
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/login">Go to Login</Link>
                </Button>
            </CardFooter>
        </>
    );
}

// main welcome page component
export default async function AcceptInvitePage({ params }) {
    const supabase = await createClient();
    const token = params.token;

    // Fetch the invite details in a single query
    const { data: invite, error } = await supabase
        .from('invites')
        .select(`
            status,
            expires_at,
            player:players( name ),
            space:spaces( name ),
            inviter:profiles!invited_by(display_name)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

    // Validate the invitation
    if (error || !invite || new Date(invite.expires_at) < new Date()) {
        return <PageLayout>
            <InvalidInvite />
        </PageLayout>
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Check if user is logged in to show the correct UI
    if (!user) {
        return (
            <PageLayout>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to {invite.space.name}!</CardTitle>
                    <CardDescription>You&apos;ve been personally invited by {invite.inviter.display_name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-sm text-muted-foreground">
                        To accept the invitation for <span className="font-medium text-foreground">&quot;{invite.player.name}&quot;</span>, please log in or create an account.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                    <Button asChild className="w-full">
                        <Link href={`/login?token=${token}`}>Log In</Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href={`/signup?token=${token}`}>Sign Up</Link>
                    </Button>
                </CardFooter>
            </PageLayout>
        )
    }

    // The page now renders the client component for the form
    return (
        <PageLayout>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                    You&apos;re Invited!
                </CardTitle>
                <CardDescription>
                    You&apos;ve been invited to join {invite.space.name}.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{invite.inviter.display_name}</span> has invited you to claim the player profile for <span className="font-semibold text-foreground">&quot;{invite.player.name}&quot;</span>.
                </p>
            </CardContent>
            <CardFooter>
                <AcceptInviteForm token={token} />
            </CardFooter>
        </PageLayout>
    );
}