import { User, Opportunity, SignUp, Badge, Organization, Member } from '../types';

const countSignupsForCause = (
  cause: string,
  data: { signups: SignUp[]; opportunities: Opportunity[] }
) => {
  return data.signups.filter((su) => {
    const opp = data.opportunities.find((o) => o.id === su.opportunityId);
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
  const allUsers = data.users || [];

  // Sort users by points in descending order
  const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);

  // Find the rank of the user with the given points
  const rank = sortedUsers.findIndex((user) => user.points === data.points) + 1;

  // If user not found, return a high rank (not in top 10)
  return rank > 0 ? rank : 999;
};

export const initialBadges: Badge[] = [
  {
    id: 'first-volunteer',
    name: 'First Step',
    description: 'Signed up for your first opportunity!',
    icon: '/badges/first-volunteer.png',
    threshold: (d) => d.signUpCount >= 1,
  },
  {
    id: 'point-novice',
    name: 'Point Novice',
    description: 'Earned over 20 points.',
    icon: '/badges/point-novice.png',
    threshold: (d) => d.points > 20,
  },
  {
    id: 'point-adept',
    name: 'Point Adept',
    description: 'Earned over 50 points.',
    icon: '/badges/point-adept.png',
    threshold: (d) => d.points > 50,
  },
  {
    id: 'point-master',
    name: 'Point Master',
    description: 'Earned over 100 points.',
    icon: '/badges/point-master.png',
    threshold: (d) => d.points > 100,
  },
  {
    id: 'serial-volunteer',
    name: 'Serial Volunteer',
    description: 'Signed up for 3+ opportunities.',
    icon: '/badges/serial-volunteer.png',
    threshold: (d) => d.signUpCount >= 3,
  },
  {
    id: 'community-pillar',
    name: 'Community Pillar',
    description: 'Signed up for 5+ opportunities.',
    icon: '/badges/community-pillar.png',
    threshold: (d) => d.signUpCount >= 5,
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Made 3+ friends.',
    icon: '/badges/social-butterfly.png',
    threshold: (d) => d.friendsCount >= 3,
  },
  {
    id: 'networker',
    name: 'Super Networker',
    description: 'Made 5+ friends.',
    icon: '/badges/networker.png',
    threshold: (d) => d.friendsCount >= 5,
  },
  {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Volunteered for 2+ environmental events.',
    icon: '/badges/eco-warrior.png',
    threshold: (d) => countSignupsForCause('Environment & Sustainability', d) >= 2,
  },
  {
    id: 'community-champion',
    name: 'Hunger Hero',
    description: 'Volunteered for 2+ food security events.',
    icon: '/badges/community-champion.png',
    threshold: (d) => countSignupsForCause('Food Security and Hunger Relief', d) >= 2,
  },
  {
    id: 'top-ten',
    name: 'Top Ten',
    description: 'Ranked top ten on leaderboard.',
    icon: '/badges/top-ten.png',
    threshold: (d) => findRank(d) <= 10,
  },
];

export const ourTeam: Member[] = [
  {
    id: 2,
    name: 'Ezra Min',
    picture: './team_pic/ezra.jpeg',
    hometown: 'Ann Arbor, MI',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: ['Cru', 'Club Hockey', 'SEGC', '180DC'],
    favoriteService:
      'Adopt-A-Highway cleanup on a rainy Ithaca day–there’s something beautiful about digging in the dirt with some of your best friends.',
    role: 'Chief Executive Officer',
  },
  {
    id: 12,
    name: 'Lee Brown',
    picture: './team_pic/lee.png',
    hometown: 'Chapin, SC',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: ['Cornell Business Review', 'Cornell Votes', 'Housing and Res Life'],
    favoriteService: 'I had the wonderful opportunity to help clean trails at the Adirondacks.',
    role: 'Chief Operating Officer',
  },
  {
    id: 15,
    name: 'Scott Fukuda',
    picture: './team_pic/scott.png',
    hometown: 'El Segundo, CA',
    major: 'Computer Science',
    class: '2028',
    campusOrgs: ['Cru', 'CUAir'],
    favoriteService: 'Moving couches with the boys in Tyvek suits in the rain 😤',
    role: 'Chief Technology Officer',
  },
  {
    id: 14,
    name: 'Ailin Chen',
    picture: './team_pic/ailin.png',
    hometown: 'Bay Area, CA',
    major: 'Industrial and Labor Relations',
    class: '2027',
    campusOrgs: ['AAIV', 'Cornell Political Union', 'Prep'],
    favoriteService:
      'Through Prison Express, I was able to view artwork created by incarcerated youth and write letters in response. It’s a powerful way to connect with them, offer encouragement, and create a sense of shared humanity through art and words.',
    role: 'Chief Marketing Officer',
  },
  {
    id: 3,
    name: 'Benjamin Chen',
    picture: './team_pic/ben.png',
    hometown: 'Long Beach, CA',
    major: 'Biology - Computational Biology',
    class: '2027',
    campusOrgs: ['TASA', 'KDSAP', 'HEART'],
    favoriteService:
      'Volunteering with HEART to teach elementary school students about health has been one of my most meaningful experiences. Introducing concepts like nutrition, exercise, and wellness at an early age showed me how education can empower young people to make informed choices and build healthier futures.',
    role: 'Chief Growth Officer',
  },

  {
    id: 129,
    name: 'Grace Matsuoka',
    picture: './team_pic/grace.jpeg',
    hometown: 'Olympia, WA',
    major: 'Computer Science',
    class: '2028',
    campusOrgs: ['Cru', 'Hack4Impact'],
    favoriteService:
      'Helping clean local trails to make them more accessible to the public back in Washington!',
    role: 'Director of Technical Development',
  },
  {
    id: 17,
    name: 'William Mullins',
    picture: './team_pic/will.png',
    hometown: 'Kearny, NJ',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: [
      'Sports Business Society',
      'Cru',
      'Cornell American Cancer Society',
      'Intramural Sports',
    ],
    favoriteService:
      "My favorite community service experience was volunteering at my town's public library. Over the summer, I helped organize events and worked with children on a variety of activities. I particularly enjoyed playing games with them, such as chess, checkers, ping pong. I was even able to improve my own arts and crafts skills while assisting with creative sessions. Volunteering at my town's library was an especially rewarding experience because it gave me the opportunity to engage with the youth in my community. Witnessing their passion and enthusiasm for learning new skills made me optimistic about the bright future of my town!",
    role: 'Chief Strategy Officer',
  },
  {
    id: 142,
    name: 'Riley Smith',
    picture: './team_pic/riley.png',
    hometown: 'Buffalo, New York',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: ['Outdoor Odyssey Guide', 'Tradition Fellow'],
    favoriteService:
      'Any time I am able to coach soccer in my hometown Buffalo, New York. There is something so special to me giving back to a community that has shaped me into the person I am today.',
    role: 'Director of Partnerships',
  },
  {
    id: 106,
    name: 'Leslie Baker',
    picture: './team_pic/leslie.png',
    hometown: 'Franklin, MA',
    major: 'Biomedical Engineering',
    class: '2028',
    campusOrgs: [
      'Cru',
      'Big Red Buddies',
      'Perfect Pair',
      'Society of Women Engineers',
      'CU Empower',
    ],
    favoriteService:
      'My favorite service experience was coaching 3rd and 4th grade girls’ soccer. All through high school, I was very involved in my town’s soccer program, including volunteer coaching. Over seven seasons, I had the privilege of watching each girl grow in skill and confidence while also learning to love the game. Building connections with every player and giving them the same fun and educational soccer experience I had as a child was incredibly rewarding. Last year, I even got to see two of the girls I once coached compete in the state semifinals. Watching their growth and continued passion for soccer was one of the most fulfilling moments of my coaching experience.',
    role: 'Outreach Manager',
  },
  {
    id: 168,
    name: 'Kate Shum',
    picture: './team_pic/kate.png',
    hometown: 'Marlboro, NJ',
    major: 'Computer Science',
    class: '2028',
    campusOrgs: ['Bethany CCC'],
    favoriteService: "Volunteering at my local elementary school's after-school program!",
    role: 'Frontend Developer',
  },
  {
    id: 283,
    name: 'Alex Del Rosario',
    picture: './team_pic/alex.jpeg',
    hometown: 'Queens, NY',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: ['PAD', 'CIPEC', 'ACLU', 'CFA', 'Cornell Catholic'],
    favoriteService: "Volunteering for my friend’s Indonesian Food Bazaar event and bringing together members of my community to celebrate Indonesian culture!",
    role: 'Communication Manager',
  },
    {
    id: 199,
    name: 'Tayten Han',
    picture: './team_pic/tayten.JPG',
    hometown: 'Simi Valley, CA',
    major: 'Industrial and Labor Relations',
    class: '2028',
    campusOrgs: ['CULSR', 'M&A Club', 'Moot Court'],
    favoriteService: "Volunteering at multiple after-school programs at my local middle schools!",
    role: 'Brand Strategy Manager',
  },
];
