
import { User, Opportunity, SignUp, Badge, Organization, Member } from '../types';

export const initialStudents: User[] = [
    { id: 1, name: 'Alice Johnson', email: 'aj123@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief', 'Other'], friendIds: [8, 3, 9], organizationIds: [101, 201], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Computer Science', birthday: '2003-05-15', points: 180, car_seats: 0, registration_date: '2024-01-15T10:30:00' },
  { id: 2, name: 'Ben Carter', email: 'bc456@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Environment & Sustainability', 'Education'], friendIds: [4, 9], organizationIds: [102, 301], graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Environmental Engineering', birthday: '2002-08-22', points: 150, car_seats: 0, registration_date: '2024-01-20T14:15:00' },
  { id: 3, name: 'Chloe Davis', email: 'cd789@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [1], organizationIds: [401], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Human Ecology', birthday: '2003-12-03', points: 180, car_seats: 0, registration_date: '2024-02-05T09:45:00' },
  { id: 4, name: 'David Evans', email: 'de101@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Environment & Sustainability'], friendIds: [2], organizationIds: [102, 501], graduationYear: '2027', academicLevel: 'Undergraduate', major: 'Mechanical Engineering', birthday: '2004-03-18', points: 240, car_seats: 0, registration_date: '2024-02-12T16:20:00' },
  { id: 5, name: 'Emily Frank', email: 'ef112@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [], organizationIds: [101, 601], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Nutrition Science', birthday: '2003-07-30', points: 120, car_seats: 0, registration_date: '2024-02-18T11:30:00' },
  { id: 6, name: 'Frank Green', email: 'fg131@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Education'], friendIds: [], organizationIds: [402], graduationYear: '2026', academicLevel: 'Graduate', major: 'Educational Psychology', birthday: '2001-11-14', points: 210, car_seats: 0, registration_date: '2024-03-01T13:45:00' },
  { id: 7, name: 'Grace Hill', email: 'gh141@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Other', 'Environment & Sustainability'], friendIds: [], organizationIds: [102], graduationYear: '2025', academicLevel: 'Undergraduate', major: 'Business', birthday: '2003-09-07', points: 240, car_seats: 0, registration_date: '2024-03-08T15:10:00' },
  { id: 8, name: 'Henry Irving', email: 'hi151@cornell.edu', password: 'password123', profile_image: undefined, interests: ['Food Security and Hunger Relief'], friendIds: [1], organizationIds: [202], graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Agriculture', birthday: '2002-04-25', points: 180, car_seats: 0, registration_date: '2024-03-15T12:00:00' },
  // Admin User
  { id: 9, name: 'Ezra Min', email: 'ejm376@cornell.edu', password: 'test1234', profile_image: undefined, interests: ['Food Security and Hunger Relief', 'Education', 'Other'], friendIds: [1,2], organizationIds: [101, 502], admin: true, graduationYear: '2026', academicLevel: 'Undergraduate', major: 'Information Science', birthday: '2002-01-12', points: 420, car_seats: 0, registration_date: '2024-01-10T08:00:00' },
];

export const initialOpportunities: Opportunity[] = [
  {
    id: 1,
    nonprofit: 'Loaves & Fishes',
    name: 'Community Meal Service',
    description: 'Help prepare and serve free meals to community members in a respectful and welcoming environment.',
    date: '2025-09-01', time: '15:00', duration: 3, total_slots: 8,
    imageUrl: 'https://images.squarespace-cdn.com/content/v1/55b8da45e4b0994f34d19b7a/1529088656114-ZJDDQ2DCEVDP0T22K0DS/L%26F-2017-8-2-Meal-154.jpg?format=1500w',
    points: 180, causes: ['Food Security and Hunger Relief'], tags: ['Food Provided'], address: '123 Main St, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable working with people', 'Food safety training provided'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 2,
    nonprofit: 'Finger Lakes ReUse',
    name: 'Donation Sorting',
    description: 'Assist in sorting incoming donations and arranging items on the sales floor. Help keep useful materials out of the landfill!',
    date: '2025-09-02', time: '11:00', duration: 2.5, total_slots: 10,
    imageUrl: 'https://www.ithaca.com/content/tncms/assets/v3/editorial/b/5a/b5a45b88-51f7-11ed-b5f7-3b2b52865983/635c13e4811a4.image.jpg?resize=1200%2C900',
    points: 150, causes: ['Environment & Sustainability'], tags: [], address: '456 Elm St, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Attention to detail', 'Ability to lift up to 20 lbs'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 3,
    nonprofit: 'Ithaca Children\'s Garden',
    name: 'Garden Weeding & Maintenance',
    description: 'Get your hands dirty and help maintain the beautiful and playful gardens that serve as a resource for local children.',
    date: '2025-09-03', time: '09:00', duration: 3, total_slots: 15,
    imageUrl: 'https://ithacachildrensgarden.org/wp-content/uploads/2019/12/hands-on-nature-anarchy-zone.jpg',
    points: 180, causes: ['Education'], tags: [], address: '789 Oak Ave, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable working outdoors', 'Ability to bend and kneel'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 4,
    nonprofit: 'Cayuga Nature Center',
    name: 'Animal Care Assistant',
    description: 'Assist the staff with daily feeding, cleaning, and care for the resident animals at the nature center.',
    date: '2025-09-04', time: '13:00', duration: 4, total_slots: 6,
    imageUrl: 'https://www.priweb.org/wp-content/uploads/2021/08/CayugaNatureCenter-Lodge-1.jpg',
    points: 240, causes: ['Other'], tags: [], address: '321 Pine Rd, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable around animals', 'Ability to follow safety protocols'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 5,
    nonprofit: 'SPCA of Tompkins County',
    name: 'Dog Walking & Socialization',
    description: 'Give shelter dogs some much-needed exercise and affection by taking them for walks on the SPCA trails.',
    date: '2025-09-05', time: '10:00', duration: 2, total_slots: 12,
    imageUrl: 'https://www.humanesociety.org/sites/default/files/2022-08/woman-walking-dog-leash-575359.jpg',
    points: 120, causes: ['Other'], tags: [], address: '654 Maple Dr, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable around dogs', 'Ability to walk for extended periods'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 6,
    nonprofit: 'Sciencenter',
    name: 'Exhibit Floor Volunteer',
    description: 'Engage with families and children on the museum floor, helping them interact with exhibits and facilitating scientific discovery.',
    date: '2025-09-06', time: '12:00', duration: 3.5, total_slots: 8,
    imageUrl: 'https://www.sciencenter.org/images/sized/images/uploads/exhibits/Curiosity_Corner_from_above-1200x800.jpg',
    points: 210, causes: ['Education'], tags: [], address: '987 Cedar Ln, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable interacting with children', 'Interest in science education'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 7,
    nonprofit: 'State Theatre of Ithaca',
    name: 'Event Ushering',
    description: 'Help with ticket scanning, guiding patrons to their seats, and ensuring a great experience for a concert night.',
    date: '2025-09-06', time: '18:00', duration: 4, total_slots: 10,
    imageUrl: 'https://stateofithaca.org/wp-content/uploads/2021/11/IMG_8778-scaled.jpg',
    points: 240, causes: ['Other'], tags: [], address: '147 State St, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable with crowds', 'Professional appearance'],
    visibility: ['public'],
    attendance_marked: false
  },
  {
    id: 8,
    nonprofit: 'Ithaca Trails',
    name: 'Trail Maintenance Day',
    description: 'Work with a team to clear brush, repair pathways, and help maintain the beautiful natural trails around Ithaca.',
    date: '2025-09-07', time: '09:00', duration: 4, total_slots: 20,
    imageUrl: 'https://www.visitithaca.com/sites/default/files/styles/16_9_1200x675/public/2022-06/robert-h-treman-lucifer-falls-hike-ithaca-ny-1_0.jpg?h=a5f15949&itok=BAP-cTcu',
    points: 240, causes: ['Environment & Sustainability'], tags: [], address: '258 Forest Way, Ithaca, NY', approved: true,
    comments: [],
    qualifications: ['No experience required', 'Comfortable working outdoors', 'Ability to use basic tools'],
    visibility: ['public'],
    attendance_marked: false
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

/**
 * Helper function to find a user's rank based on their points
 * @param data - Object containing user data with points
 * @returns The user's rank (1-based, where 1 is the highest points)
 */
export const findRank = (data: { points: number; users?: User[] }): number => {
    // If users array is provided, use it; otherwise use initialStudents
    const allUsers = data.users || initialStudents;
    
    // Sort users by points in descending order
    const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);
    
    // Find the rank of the user with the given points
    const rank = sortedUsers.findIndex(user => user.points === data.points) + 1;
    
    // If user not found, return a high rank (not in top 10)
    return rank > 0 ? rank : 999;
};

export const initialBadges: Badge[] = [
    { id: 'first-volunteer', name: 'First Step', description: 'Signed up for your first opportunity!', icon: '/badges/first-volunteer.png', threshold: (d) => d.signUpCount >= 1 },
    { id: 'point-novice', name: 'Point Novice', description: 'Earned over 20 points.', icon: '/badges/point-novice.png', threshold: (d) => d.points > 20 },
    { id: 'point-adept', name: 'Point Adept', description: 'Earned over 50 points.', icon: '/badges/point-adept.png', threshold: (d) => d.points > 50 },
    { id: 'point-master', name: 'Point Master', description: 'Earned over 100 points.', icon: '/badges/point-master.png', threshold: (d) => d.points > 100 },
    { id: 'serial-volunteer', name: 'Serial Volunteer', description: 'Signed up for 3+ opportunities.', icon: '/badges/serial-volunteer.png', threshold: (d) => d.signUpCount >= 3 },
    { id: 'community-pillar', name: 'Community Pillar', description: 'Signed up for 5+ opportunities.', icon: '/badges/community-pillar.png', threshold: (d) => d.signUpCount >= 5 },
    { id: 'social-butterfly', name: 'Social Butterfly', description: 'Made 3+ friends.', icon: '/badges/social-butterfly.png', threshold: (d) => d.friendsCount >= 3 },
    { id: 'networker', name: 'Super Networker', description: 'Made 5+ friends.', icon: '/badges/networker.png', threshold: (d) => d.friendsCount >= 5 },
    { id: 'eco-warrior', name: 'Eco Warrior', description: 'Volunteered for 2+ environmental events.', icon: '/badges/eco-warrior.png', threshold: (d) => countSignupsForCause('Environment & Sustainability', d) >= 2 },
    { id: 'community-champion', name: 'Hunger Hero', description: 'Volunteered for 2+ food security events.', icon: '/badges/community-champion.png', threshold: (d) => countSignupsForCause('Food Security and Hunger Relief', d) >= 2 },
    { id: 'top-ten', name: 'Top Ten', description: 'Ranked top ten on leaderboard.', icon: '/badges/top-ten.png', threshold: (d) => findRank(d) <= 10 },
  ];

  export const ourTeam: Member[] = [
      {
        "id": "ezra-min",
        "name": "Ezra Min",
        "picture": "./team_pic/ezra.jpeg",
        "hometown": "Ann Arbor, MI",
        "major": "Industrial and Labor Relations",
        "class": "2028",
        "campusOrgs": ["Cru", "Club Hockey", "SEGC", "180DC"],
        "favoriteService": "working at a summer camp in Clay County, KY",
        "role": "Chief Executive Officer"
      },
      {
        "id": "benjamin-chen",
        "name": "Benjamin Chen",
        "picture": "./team_pic/ben.png",
        "hometown": "Long Beach, CA",
        "major": "Biology - Computational Biology",
        "class": "2027",
        "campusOrgs": ["TASA", "KDSAP", "HEART"],
        "favoriteService": "Volunteering with HEART to teach elementary school students about health has been one of my most meaningful experiences. Introducing concepts like nutrition, exercise, and wellness at an early age showed me how education can empower young people to make informed choices and build healthier futures.",
        "role": "Director of Growth"
      },
      {
        "id": "lee-brown",
        "name": "Lee Brown",
        "picture":"./team_pic/lee.png",
        "hometown": "Chapin, SC",
        "major": "Industrial and Labor Relations",
        "class": "2028",
        "campusOrgs": ["Cornell Business Review", "Cornell Votes", "Housing and Res Life"],
        "favoriteService": "I had the wonderful opportunity to help clean trails at the Adirondacks.",
        "role": "Chief Operating Officer"
      },
      {
        "id": "william-mullins",
        "name": "William Mullins",
        "picture": "./team_pic/will.png",
        "hometown": "Kearny, NJ",
        "major": "Industrial and Labor Relations",
        "class": "2028",
        "campusOrgs": [
          "Sports Business Society",
          "Cru",
          "Cornell American Cancer Society",
          "Intramural Sports"
        ],
        "favoriteService": "My favorite community service experience was volunteering at my town's public library. Over the summer, I helped organize events and worked with children on a variety of activities. I particularly enjoyed playing games with them, such as chess, checkers, ping pong. I was even able to improve my own arts and crafts skills while assisting with creative sessions. Volunteering at my town's library was an especially rewarding experience because it gave me the opportunity to engage with the youth in my community. Witnessing their passion and enthusiasm for learning new skills made me optimistic about the bright future of my town!",
        "role": "Director of Strategy and Development"
      },
      {
        "id": "scott-fukuda",
        "name": "Scott Fukuda",
        "picture": "./team_pic/scott.png",
        "hometown": "El Segundo, CA",
        "major": "Computer Science",
        "class": "2028",
        "campusOrgs": ["Cru", "CUAir"],
        "favoriteService": "Moving couches with the boys in Tyvek suits in the rain 😤",
        "role": "Chief Technology Officer"

      },
      {
        "id": "ailin-chen",
        "name": "Ailin Chen",
        "picture": "./team_pic/ailin.png",
        "hometown": "Bay Area, CA",
        "major": "Industrial and Labor Relations",
        "class": "2027",
        "campusOrgs": ["AAIV", "Cornell Political Union", "Prep"],
        "favoriteService": "Through Prison Express, I was able to view artwork created by incarcerated youth and write letters in response. It’s a powerful way to connect with them, offer encouragement, and create a sense of shared humanity through art and words.",
        "role": "Director of Marketing"
      },
      {
        "id": "leslie-baker",
        "name": "Leslie Baker",
        "picture": "./team_pic/leslie.png",
        "hometown": "Franklin, MA",
        "major": "Biomedical Engineering",
        "class": "2028",
        "campusOrgs": ["Cru", "Big Red Buddies", "Perfect Pair", "Society of Women Engineers", "CU Empower"],
        "favoriteService": "My favorite service experience was coaching 3rd and 4th grade girls’ soccer. All through high school, I was very involved in my town’s soccer program, including volunteer coaching. Over seven seasons, I had the privilege of watching each girl grow in skill and confidence while also learning to love the game. Building connections with every player and giving them the same fun and educational soccer experience I had as a child was incredibly rewarding. Last year, I even got to see two of the girls I once coached compete in the state semifinals. Watching their growth and continued passion for soccer was one of the most fulfilling moments of my coaching experience.",
        "role": "Outreach Manager"
      },
      {
        "id": "grace-matsuoka",
        "name": "Grace Matsuoka",
        "picture": "./team_pic/grace.jpeg",
        "hometown": "Olympia, WA",
        "major": "Computer Science",
        "class": "2028",
        "campusOrgs": ["Cru", "Hack4Impact"],
        "favoriteService": "Helping clean local trails to make them more accessible to the public back in Washington!",
        "role": "Director of Technical Development"
      },
      {
        "id": "riley-smith",
        "name": "Riley Smith",
        "picture": "./team_pic/riley.png",
        "hometown": "Buffalo, New York",
        "major": "Industrial and Labor Relations",
        "class": "2028",
        "campusOrgs": ["Outdoor Odyssey Guide", "Tradition Fellow"],
        "favoriteService": "Any time I am able to coach soccer in my hometown Buffalo, New York. There is something so special to me giving back to a community that has shaped me into the person I am today.",
        "role": "Director of Partnerships"
      }
  ]