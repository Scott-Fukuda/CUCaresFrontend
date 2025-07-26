
import { User, Opportunity, SignUp, StudentGroup, FriendRequest, Badge, StudentGroupCategory } from '../types';

export const initialStudents: User[] = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', email: 'aj123@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=alice', interests: ['Food Security and Hunger Relief', 'Other'], friendIds: [8, 3, 9], groupIds: [101, 201] },
  { id: 2, firstName: 'Ben', lastName: 'Carter', email: 'bc456@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=ben', interests: ['Environment & Sustainability', 'Education'], friendIds: [4, 9], groupIds: [102, 301] },
  { id: 3, firstName: 'Chloe', lastName: 'Davis', email: 'cd789@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=chloe', interests: ['Food Security and Hunger Relief'], friendIds: [1], groupIds: [401] },
  { id: 4, firstName: 'David', lastName: 'Evans', email: 'de101@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=david', interests: ['Environment & Sustainability'], friendIds: [2], groupIds: [102, 501] },
  { id: 5, firstName: 'Emily', lastName: 'Frank', email: 'ef112@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=emily', interests: ['Food Security and Hunger Relief'], friendIds: [], groupIds: [101, 601] },
  { id: 6, firstName: 'Frank', lastName: 'Green', email: 'fg131@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=frank', interests: ['Education'], friendIds: [], groupIds: [402] },
  { id: 7, firstName: 'Grace', lastName: 'Hill', email: 'gh141@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=grace', interests: ['Other', 'Environment & Sustainability'], friendIds: [], groupIds: [102] },
  { id: 8, firstName: 'Henry', lastName: 'Irving', email: 'hi151@cornell.edu', password: 'password123', profilePictureUrl: 'https://i.pravatar.cc/150?u=henry', interests: ['Food Security and Hunger Relief'], friendIds: [1], groupIds: [202] },
  // Admin User
  { id: 9, firstName: 'Ezra', lastName: 'Min', email: 'ejm376@cornell.edu', password: 'test1234', profilePictureUrl: 'https://i.pravatar.cc/150?u=ezra', interests: ['Food Security and Hunger Relief', 'Education', 'Other'], friendIds: [1,2], groupIds: [101, 502], isAdmin: true },
];

export const initialOpportunities: Opportunity[] = [
  {
    id: 1,
    organization: 'Loaves & Fishes',
    title: 'Community Meal Service',
    description: 'Help prepare and serve free meals to community members in a respectful and welcoming environment.',
    date: '2025-09-01', time: '15:00', duration: 3, totalSlots: 8,
    imageUrl: 'https://images.squarespace-cdn.com/content/v1/55b8da45e4b0994f34d19b7a/1529088656114-ZJDDQ2DCEVDP0T22K0DS/L%26F-2017-8-2-Meal-154.jpg?format=1500w',
    points: 180, cause: 'Food Security and Hunger Relief'
  },
  {
    id: 2,
    organization: 'Finger Lakes ReUse',
    title: 'Donation Sorting',
    description: 'Assist in sorting incoming donations and arranging items on the sales floor. Help keep useful materials out of the landfill!',
    date: '2025-09-02', time: '11:00', duration: 2.5, totalSlots: 10,
    imageUrl: 'https://www.ithaca.com/content/tncms/assets/v3/editorial/b/5a/b5a45b88-51f7-11ed-b5f7-3b2b52865983/635c13e4811a4.image.jpg?resize=1200%2C900',
    points: 150, cause: 'Environment & Sustainability'
  },
  {
    id: 3,
    organization: 'Ithaca Children\'s Garden',
    title: 'Garden Weeding & Maintenance',
    description: 'Get your hands dirty and help maintain the beautiful and playful gardens that serve as a resource for local children.',
    date: '2025-09-03', time: '09:00', duration: 3, totalSlots: 15,
    imageUrl: 'https://ithacachildrensgarden.org/wp-content/uploads/2019/12/hands-on-nature-anarchy-zone.jpg',
    points: 180, cause: 'Education'
  },
  {
    id: 4,
    organization: 'Cayuga Nature Center',
    title: 'Animal Care Assistant',
    description: 'Assist the staff with daily feeding, cleaning, and care for the resident animals at the nature center.',
    date: '2025-09-04', time: '13:00', duration: 4, totalSlots: 6,
    imageUrl: 'https://www.priweb.org/wp-content/uploads/2021/08/CayugaNatureCenter-Lodge-1.jpg',
    points: 240, cause: 'Other'
  },
  {
    id: 5,
    organization: 'SPCA of Tompkins County',
    title: 'Dog Walking & Socialization',
    description: 'Give shelter dogs some much-needed exercise and affection by taking them for walks on the SPCA trails.',
    date: '2025-09-05', time: '10:00', duration: 2, totalSlots: 12,
    imageUrl: 'https://www.humanesociety.org/sites/default/files/2022-08/woman-walking-dog-leash-575359.jpg',
    points: 120, cause: 'Other'
  },
  {
    id: 6,
    organization: 'Sciencenter',
    title: 'Exhibit Floor Volunteer',
    description: 'Engage with families and children on the museum floor, helping them interact with exhibits and facilitating scientific discovery.',
    date: '2025-09-06', time: '12:00', duration: 3.5, totalSlots: 8,
    imageUrl: 'https://www.sciencenter.org/images/sized/images/uploads/exhibits/Curiosity_Corner_from_above-1200x800.jpg',
    points: 210, cause: 'Education'
  },
  {
    id: 7,
    organization: 'State Theatre of Ithaca',
    title: 'Event Ushering',
    description: 'Help with ticket scanning, guiding patrons to their seats, and ensuring a great experience for a concert night.',
    date: '2025-09-06', time: '18:00', duration: 4, totalSlots: 10,
    imageUrl: 'https://stateofithaca.org/wp-content/uploads/2021/11/IMG_8778-scaled.jpg',
    points: 240, cause: 'Other'
  },
  {
    id: 8,
    organization: 'Ithaca Trails',
    title: 'Trail Maintenance Day',
    description: 'Work with a team to clear brush, repair pathways, and help maintain the beautiful natural trails around Ithaca.',
    date: '2025-09-07', time: '09:00', duration: 4, totalSlots: 20,
    imageUrl: 'https://www.visitithaca.com/sites/default/files/styles/16_9_1200x675/public/2022-06/robert-h-treman-lucifer-falls-hike-ithaca-ny-1_0.jpg?h=a5f15949&itok=BAP-cTcu',
    points: 240, cause: 'Environment & Sustainability'
  },
];


export const initialSignUps: SignUp[] = [
  { userId: 1, opportunityId: 1 }, { userId: 3, opportunityId: 1 }, { userId: 5, opportunityId: 1 },
  { userId: 2, opportunityId: 2 }, { userId: 4, opportunityId: 2 }, { userId: 7, opportunityId: 2 },
  { userId: 1, opportunityId: 3 }, { userId: 8, opportunityId: 3 },
  { userId: 2, opportunityId: 4 }, { userId: 6, opportunityId: 5 }, { userId: 1, opportunityId: 7 },
  { userId: 3, opportunityId: 8 }, { userId: 9, opportunityId: 1 }, { userId: 9, opportunityId: 7 },
];


export const initialStudentGroups: StudentGroup[] = [
    { id: 101, name: 'Engineers for a Sustainable World', category: 'Professional Club' }, { id: 102, name: 'Cornell Consulting Club', category: 'Professional Club' },
    { id: 201, name: 'Alpha Phi Omega', category: 'Fraternity' }, { id: 202, name: 'Sigma Chi', category: 'Fraternity' },
    { id: 301, name: 'Delta Gamma', category: 'Sorority' }, { id: 302, name: 'Alpha Phi', category: 'Sorority' },
    { id: 401, name: 'Cornell Varsity Football', category: 'Sports Team' }, { id: 402, name: 'Club Tennis', category: 'Sports Team' },
    { id: 501, name: 'The Hangovers', category: 'Performing Arts Group' }, { id: 502, name: 'Cornell University Glee Club', category: 'Performing Arts Group' },
    { id: 601, name: 'Cornell Baja SAE Racing', category: 'Project Team' }, { id: 602, name: 'CUAir', category: 'Project Team' },
];

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