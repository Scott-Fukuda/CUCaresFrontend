
import React, { useMemo } from 'react';
import { Organization, User, Opportunity, SignUp } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl, updateOrganization } from '../api';

interface GroupDetailPageProps {
  org: Organization;
  allUsers: User[];
  allOrgs: Organization[];
  opportunities: Opportunity[];
  signups: SignUp[];
  currentUser: User;
  setPageState: (state: PageState) => void;
  joinOrg: (orgId: number) => void;
  leaveOrg: (orgId: number) => void;
}

const TrophyIcon: React.FC<{className?: string}> = ({className}) => (
  <img 
    src="/icons/points-icon.png" 
    alt="Points" 
    className={className || 'h-5 w-5'}
  />
);
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
    src="/icons/groups-icon.png" 
    alt="Groups" 
    className={props.className || 'h-6 w-6'}
  />
);
const LeaderboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
    src="/icons/leaderboard-icon.png" 
    alt="Leaderboard" 
    className={props.className || 'h-6 w-6'}
  />
);
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>;

const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ org, allUsers, allOrgs, opportunities, signups, currentUser, setPageState, joinOrg, leaveOrg }) => {
  const isMember = currentUser.organizationIds && currentUser.organizationIds.includes(org.id);

  const handleUnapproveOrganization = async () => {
    const confirmed = window.confirm(`Are you sure you want to unapprove the organization "${org.name}"? This will hide it from all users.`);
    if (!confirmed) return;

    try {
      await updateOrganization(org.id, { approved: false });
      alert('Organization has been unapproved successfully!');
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      alert(`Error unapproving organization: ${error.message}`);
    }
  };

  const { members, memberCount, orgTotalPoints, orgRank, upcomingEvents } = useMemo(() => {
    // Use the same calculation method as leaderboard
    const memberIds = allUsers.filter(u => u.organizationIds && u.organizationIds.includes(org.id)).map(u => u.id);
    const currentMembers = allUsers.filter(u => memberIds.includes(u.id));
    
    // Use backend member_count if available, otherwise calculate from current members
    const memberCount = org.member_count !== undefined ? org.member_count : currentMembers.length;

    // Use the same points calculation as leaderboard
    const totalPoints = memberIds.reduce((sum, memberId) => {
        const user = allUsers.find(u => u.id === memberId);
        return sum + (user?.points || 0);
    }, 0);

    const categoryOrgs = allOrgs.filter(g => g.type === org.type)
        .map(g => {
            const orgMemberIds = allUsers.filter(u => u.organizationIds && u.organizationIds.includes(g.id)).map(u => u.id);
            const points = orgMemberIds.reduce((sum, memberId) => {
                const user = allUsers.find(u => u.id === memberId);
                return sum + (user?.points || 0);
            }, 0);
            return { id: g.id, points };
        })
        .sort((a,b) => b.points - a.points);
    
    const rank = categoryOrgs.findIndex(g => g.id === org.id) + 1;

    // Find upcoming events for the group
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memberIdsSet = new Set(currentMembers.map(m => m.id));
    const groupOppIds = new Set<number>();
    signups.forEach(s => {
        if(memberIdsSet.has(s.userId)) {
            groupOppIds.add(s.opportunityId);
        }
    });

    const events = opportunities
        .filter(opp => groupOppIds.has(opp.id) && new Date(`${opp.date}T00:00:00`).getTime() >= today.getTime())
        .map(opp => {
            const attendingMemberCount = signups.filter(s => s.opportunityId === opp.id && memberIdsSet.has(s.userId)).length;
            return { ...opp, attendingMemberCount };
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return { members: currentMembers, memberCount, orgTotalPoints: totalPoints, orgRank: rank, upcomingEvents: events };
  }, [org, allUsers, allOrgs, opportunities, signups]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold">{org.name}</h2>
            <p className="text-gray-500 font-semibold mb-6">{org.type}</p>
            <button
              onClick={() => isMember ? leaveOrg(org.id) : joinOrg(org.id)}
              className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-white ${
                isMember
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isMember ? 'Leave Organization' : 'Join Organization'}
            </button>
            
            {/* Admin Unapprove Button */}
            {currentUser.admin && org.approved !== false && (
              <button
                onClick={handleUnapproveOrganization}
                className="w-full mt-4 font-bold py-3 px-4 rounded-lg transition-colors text-white bg-orange-600 hover:bg-orange-700"
              >
                Unapprove Organization
              </button>
            )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
             <h3 className="text-xl font-bold mb-4">Organization Stats</h3>
             <ul className="space-y-4">
                <li className="flex items-center gap-4 text-lg">
                    <TrophyIcon className="h-8 w-8 text-yellow-500"/>
                    <div>
                        <p className="font-bold text-gray-800">{orgTotalPoints.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Total Points</p>
                    </div>
                </li>
                 <li className="flex items-center gap-4 text-lg">
                    <UsersIcon className="h-8 w-8 text-blue-500"/>
                    <div>
                        <p className="font-bold text-gray-800">{memberCount}</p>
                        <p className="text-sm text-gray-500">Members</p>
                    </div>
                    
                </li>
                 <li className="flex items-center gap-4 text-lg">
                    <LeaderboardIcon className="h-8 w-8 text-green-500"/>
                    <div>
                        <p className="font-bold text-gray-800">#{orgRank}</p>
                        <p className="text-sm text-gray-500">Rank in {org.type}</p>
                    </div>
                </li>
             </ul>
        </div>
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
         <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Members ({memberCount})</h3>
            {memberCount > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {members.length > 0 ? (
                        members.sort((a,b) => a.name.localeCompare(b.name)).map(member => (
                            <div key={member.id} onClick={() => setPageState({ page: 'profile', userId: member.id })} className="flex items-center gap-2 p-2 pr-4 bg-light-gray rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
                                <img 
                                    src={getProfilePictureUrl(member.profile_image)} 
                                                                         alt={member.name}
                                    className="w-9 h-9 rounded-full object-cover"
                                />
                                                                 <span className="text-sm font-medium text-gray-800">{member.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Member list not available, but {memberCount} member{memberCount !== 1 ? 's' : ''} exist{memberCount !== 1 ? '' : 's'}.</p>
                    )}
                </div>
            ) : (
                <p className="text-gray-500">This organization has no members yet.</p>
            )}
         </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;