// components/emails/InvitationEmail.jsx

import * as React from 'react';
import { Html, Button, Heading, Text } from '@react-email/components';

export function InvitationEmail({ inviteLink, spaceName, invitedBy }) {
    return (
        <Html>
            <Heading>Your Invitation to Join {spaceName}</Heading>
            <Text>
                Hi there,
            </Text>
            <Text>
                {invitedBy} has personally invited you to join the {spaceName} club space.
            </Text>
            <Text>
                Accept your invitation to view club events, track your match history, and connect with other members.
            </Text>
            <Button
                href={inviteLink}
                style={{ background: '#000', color: '#fff', padding: '12px 20px' }}
            >
                Accept Your Invitation
            </Button>
        </Html>
    );
}