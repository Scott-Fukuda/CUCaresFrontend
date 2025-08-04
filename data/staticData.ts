
import { FriendRequest, Badge, SignUp, Opportunity } from '../types';

export const initialFriendRequests: FriendRequest[] = [
    { fromUserId: 6, toUserId: 1, status: 'pending' }, { fromUserId: 7, toUserId: 1, status: 'pending' },
];

const countSignupsForCause = (cause: string, data: { signups: SignUp[]; opportunities: Opportunity[] }) => {
    return data.signups.filter(su => {
        const opp = data.opportunities.find(o => o.id === su.opportunityId);
        return opp?.cause === cause;
    }).length;
};

export const initialBadges: Badge[] = [
    { id: 'first-volunteer', name: 'First Step', description: 'Signed up for your first opportunity!', icon: '👟', threshold: (d) => d.signUpCount >= 1 },
    { id: 'point-novice', name: 'Point Novice', description: 'Earned over 20 points.', icon: '⭐', threshold: (d) => d.points > 20 },
    { id: 'point-adept', name: 'Point Adept', description: 'Earned over 50 points.', icon: '🌟', threshold: (d) => d.points > 50 },
    { id: 'point-master', name: 'Point Master', description: 'Earned over 100 points.', icon: '🏆', threshold: (d) => d.points > 100 },
    { id: 'serial-volunteer', name: 'Serial Volunteer', description: 'Signed up for 3+ opportunities.', icon: '📅', threshold: (d) => d.signUpCount >= 3 },
    { id: 'community-pillar', name: 'Community Pillar', description: 'Signed up for 5+ opportunities.', icon: '🏛️', threshold: (d) => d.signUpCount >= 5 },
    { id: 'social-butterfly', name: 'Social Butterfly', description: 'Made 3+ friends.', icon: '🦋', threshold: (d) => d.friendsCount >= 3 },
    { id: 'networker', name: 'Super Networker', description: 'Made 5+ friends.', icon: '🤝', threshold: (d) => d.friendsCount >= 5 },
    { id: 'eco-warrior', name: 'Eco Warrior', description: 'Volunteered for 2+ environmental events.', icon: '🌿', threshold: (d) => countSignupsForCause('Environment & Sustainability', d) >= 2 },
    { id: 'community-champion', name: 'Hunger Hero', description: 'Volunteered for 2+ food security events.', icon: '❤️', threshold: (d) => countSignupsForCause('Food Security and Hunger Relief', d) >= 2 },
];
