
import { User, Opportunity, SignUp, Badge, Organization } from '../types';

export const initialStudents: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'aj123@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief', 'Other'], friendIds: [8, 3, 9], organizationIds: [101, 201], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Computer Science', birthday: '2003-05-15', points: 180, registration_date: '2024-01-15T10:30:00' },
  { id: 2, name: 'Ben Carter', email: 'bc456@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Environment & Sustainability', 'Education'], friendIds: [4, 9], organizationIds: [102, 301], graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Environmental Engineering', birthday: '2002-08-22', points: 150, registration_date: '2024-01-20T14:15:00' },
  { id: 3, name: 'Chloe Davis', email: 'cd789@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [1], organizationIds: [401], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Human Ecology', birthday: '2003-12-03', points: 180, registration_date: '2024-02-05T09:45:00' },
  { id: 4, name: 'David Evans', email: 'de101@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Environment & Sustainability'], friendIds: [2], organizationIds: [102, 501], graduationYear: '2027', academicLevel: 'Undergraduate', major: 'Mechanical Engineering', birthday: '2004-03-18', points: 240, registration_date: '2024-02-12T16:20:00' },
  { id: 5, name: 'Emily Frank', email: 'ef112@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [], organizationIds: [101, 601], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Nutrition Science', birthday: '2003-07-30', points: 120, registration_date: '2024-02-18T11:30:00' },
  { id: 6, name: 'Frank Green', email: 'fg131@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Education'], friendIds: [], organizationIds: [402], graduationYear: '2026', academicLevel: 'Graduate', major: 'Educational Psychology', birthday: '2001-11-14', points: 210, registration_date: '2024-03-01T13:45:00' },
  { id: 7, name: 'Grace Hill', email: 'gh141@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Other', 'Environment & Sustainability'], friendIds: [], organizationIds: [102], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Business', birthday: '2003-09-07', points: 240, registration_date: '2024-03-08T15:10:00' },
  { id: 8, name: 'Henry Irving', email: 'hi151@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [1], organizationIds: [202], graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Agriculture', birthday: '2002-04-25', points: 180, registration_date: '2024-03-15T12:00:00' },
  // Admin User
  { id: 9, name: 'Ezra Min', email: 'ejm376@cornell.edu', password: 'test1234', profile_image: undefined, interests: ['Food Security and Hunger Relief', 'Education', 'Other'], friendIds: [1,2], organizationIds: [101, 502], admin: true, graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Information Science', birthday: '2002-01-12', points: 420, registration_date: '2024-01-10T08:00:00' },
];

export const initialOpportunities: Opportunity[] = [
  {
    id: 1,
    nonprofit: 'Loaves & Fishes',
    name: 'Community Meal Service',
    description: 'Help prepare and serve free meals to community members in a respectful and welcoming environment.',
    date: '2025-09-01', time: '15:00', duration: 3, totalSlots: 8,
    imageUrl: 'https://images.squarespace-cdn.com/content/v1/55b8da45e4b0994f34d19b7a/1529088656114-ZJDDQ2DCEVDP0T22K0DS/L%26F-2017-8-2-Meal-154.jpg?format=1500w',
    points: 180, causes: ['Food Security and Hunger Relief'], address: '123 Main St, Ithaca, NY', approved: true
  },
  {
    id: 2,
    nonprofit: 'Finger Lakes ReUse',
    name: 'Donation Sorting',
    description: 'Assist in sorting incoming donations and arranging items on the sales floor. Help keep useful materials out of the landfill!',
    date: '2025-09-02', time: '11:00', duration: 2.5, totalSlots: 10,
    imageUrl: 'https://www.ithaca.com/content/tncms/assets/v3/editorial/b/5a/b5a45b88-51f7-11ed-b5f7-3b2b52865983/635c13e4811a4.image.jpg?resize=1200%2C900',
    points: 150, causes: ['Environment & Sustainability'], address: '456 Elm St, Ithaca, NY', approved: true
  },
  {
    id: 3,
    nonprofit: 'Ithaca Children\'s Garden',
    name: 'Garden Weeding & Maintenance',
    description: 'Get your hands dirty and help maintain the beautiful and playful gardens that serve as a resource for local children.',
    date: '2025-09-03', time: '09:00', duration: 3, totalSlots: 15,
    imageUrl: 'https://ithacachildrensgarden.org/wp-content/uploads/2019/12/hands-on-nature-anarchy-zone.jpg',
    points: 180, causes: ['Education'], address: '789 Oak Ave, Ithaca, NY', approved: true
  },
  {
    id: 4,
    nonprofit: 'Cayuga Nature Center',
    name: 'Animal Care Assistant',
    description: 'Assist the staff with daily feeding, cleaning, and care for the resident animals at the nature center.',
    date: '2025-09-04', time: '13:00', duration: 4, totalSlots: 6,
    imageUrl: 'https://www.priweb.org/wp-content/uploads/2021/08/CayugaNatureCenter-Lodge-1.jpg',
    points: 240, causes: ['Other'], address: '321 Pine Rd, Ithaca, NY', approved: true
  },
  {
    id: 5,
    nonprofit: 'SPCA of Tompkins County',
    name: 'Dog Walking & Socialization',
    description: 'Give shelter dogs some much-needed exercise and affection by taking them for walks on the SPCA trails.',
    date: '2025-09-05', time: '10:00', duration: 2, totalSlots: 12,
    imageUrl: 'https://www.humanesociety.org/sites/default/files/2022-08/woman-walking-dog-leash-575359.jpg',
    points: 120, causes: ['Other'], address: '654 Maple Dr, Ithaca, NY', approved: true
  },
  {
    id: 6,
    nonprofit: 'Sciencenter',
    name: 'Exhibit Floor Volunteer',
    description: 'Engage with families and children on the museum floor, helping them interact with exhibits and facilitating scientific discovery.',
    date: '2025-09-06', time: '12:00', duration: 3.5, totalSlots: 8,
    imageUrl: 'https://www.sciencenter.org/images/sized/images/uploads/exhibits/Curiosity_Corner_from_above-1200x800.jpg',
    points: 210, causes: ['Education'], address: '987 Cedar Ln, Ithaca, NY', approved: true
  },
  {
    id: 7,
    nonprofit: 'State Theatre of Ithaca',
    name: 'Event Ushering',
    description: 'Help with ticket scanning, guiding patrons to their seats, and ensuring a great experience for a concert night.',
    date: '2025-09-06', time: '18:00', duration: 4, totalSlots: 10,
    imageUrl: 'https://stateofithaca.org/wp-content/uploads/2021/11/IMG_8778-scaled.jpg',
    points: 240, causes: ['Other'], address: '147 State St, Ithaca, NY', approved: true
  },
  {
    id: 8,
    nonprofit: 'Ithaca Trails',
    name: 'Trail Maintenance Day',
    description: 'Work with a team to clear brush, repair pathways, and help maintain the beautiful natural trails around Ithaca.',
    date: '2025-09-07', time: '09:00', duration: 4, totalSlots: 20,
    imageUrl: 'https://www.visitithaca.com/sites/default/files/styles/16_9_1200x675/public/2022-06/robert-h-treman-lucifer-falls-hike-ithaca-ny-1_0.jpg?h=a5f15949&itok=BAP-cTcu',
    points: 240, causes: ['Environment & Sustainability'], address: '258 Forest Way, Ithaca, NY', approved: true
  },
];


export const initialSignUps: SignUp[] = [
  { userId: 1, opportunityId: 1 }, { userId: 3, opportunityId: 1 }, { userId: 5, opportunityId: 1 },
  { userId: 2, opportunityId: 2 }, { userId: 4, opportunityId: 2 }, { userId: 7, opportunityId: 2 },
  { userId: 1, opportunityId: 3 }, { userId: 8, opportunityId: 3 },
  { userId: 2, opportunityId: 4 }, { userId: 6, opportunityId: 5 }, { userId: 1, opportunityId: 7 },
  { userId: 3, opportunityId: 8 }, { userId: 9, opportunityId: 1 }, { userId: 9, opportunityId: 7 },
];


export const initialOrganizations: Organization[] = [
    { id: 101, name: 'Engineers for a Sustainable World', type: 'Professional Club' }, { id: 102, name: 'Cornell Consulting Club', type: 'Professional Club' },
    { id: 201, name: 'Alpha Phi Omega', type: 'Fraternity' }, { id: 202, name: 'Sigma Chi', type: 'Fraternity' },
    { id: 301, name: 'Delta Gamma', type: 'Sorority' }, { id: 302, name: 'Alpha Phi', type: 'Sorority' },
    { id: 401, name: 'Cornell Varsity Football', type: 'Sports Team' }, { id: 402, name: 'Club Tennis', type: 'Sports Team' },
    { id: 501, name: 'The Hangovers', type: 'Performing Arts Group' }, { id: 502, name: 'Cornell University Glee Club', type: 'Performing Arts Group' },
    { id: 601, name: 'Cornell Baja SAE Racing', type: 'Project Team' }, { id: 602, name: 'CUAir', type: 'Project Team' },
];



const countSignupsForCause = (cause: string, data: { signups: SignUp[]; opportunities: Opportunity[] }) => {
    return data.signups.filter(su => {
        const opp = data.opportunities.find(o => o.id === su.opportunityId);
        return opp?.causes?.includes(cause);
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