
import React, { useMemo } from 'react';
import { Organization, User, Opportunity, SignUp } from '../types';
import { PageState } from '../App';

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

const TrophyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M11.64 3.163a.75.75 0 01.09.986l-1.073 1.878A.75.75 0 019.83 6.5H6.17a.75.75 0 01-.826-.473L4.27 4.15A.75.75 0 015.344 3h9.312a.75.75 0 01.986.973l-1.878 3.286a.75.75 0 01-.65.378H8.812a.75.75 0 01-.65-.378L6.284 4.15A.75.75 0 017.357 3h4.283zM5.023 8.25a.75.75 0 01.75-.75h8.454a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H5.773a.75.75 0 01-.75-.75v-1.5zM3.523 12a.75.75 0 01.75-.75h11.454a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H4.273a.75.75 0 01-.75-.75v-1.5zM4 16.5a.75.75 0 000 1.5h12a.75.75 0 000-1.5H4z" clipRule="evenodd" /></svg>;
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.965 0m-11.925 0a3.75 3.75 0 015.965 0M9 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM21 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const LeaderboardIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>;

const GroupDetailPage: React.FC<GroupDetailPageProps> = ({ org, allUsers, allOrgs, opportunities, signups, currentUser, setPageState, joinOrg, leaveOrg }) => {
  const isMember = currentUser.organizationIds.includes(org.id);

  const { members, orgTotalPoints, orgRank, upcomingEvents } = useMemo(() => {
    const currentMembers = allUsers.filter(u => u.organizationIds.includes(org.id));

    const userPointsMap = new Map<number, number>();
    allUsers.forEach(user => {
        const points = signups
            .filter(s => s.userId === user.id)
            .reduce((total, signup) => {
                const opp = opportunities.find(o => o.id === signup.opportunityId);
                return total + (opp?.points || 0);
            }, 0);
        userPointsMap.set(user.id, points);
    });

    const totalPoints = currentMembers.reduce((sum, member) => sum + (userPointsMap.get(member.id) || 0), 0);

    const categoryOrgs = allOrgs.filter(g => g.category === org.category)
        .map(g => {
            const memberIds = allUsers.filter(u => u.organizationIds.includes(g.id)).map(u => u.id);
            const points = memberIds.reduce((sum, id) => sum + (userPointsMap.get(id) || 0), 0);
            return { id: g.id, points };
        })
        .sort((a,b) => b.points - a.points);
    
    const rank = categoryOrgs.findIndex(g => g.id === org.id) + 1;

    // Find upcoming events for the group
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memberIds = new Set(currentMembers.map(m => m.id));
    const groupOppIds = new Set<number>();
    signups.forEach(s => {
        if(memberIds.has(s.userId)) {
            groupOppIds.add(s.opportunityId);
        }
    });

    const events = opportunities
        .filter(opp => groupOppIds.has(opp.id) && new Date(`${opp.date}T00:00:00`).getTime() >= today.getTime())
        .map(opp => {
            const attendingMemberCount = signups.filter(s => s.opportunityId === opp.id && memberIds.has(s.userId)).length;
            return { ...opp, attendingMemberCount };
        })
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return { members: currentMembers, orgTotalPoints: totalPoints, orgRank: rank, upcomingEvents: events };
  }, [org, allUsers, allOrgs, opportunities, signups]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold">{org.name}</h2>
            <p className="text-gray-500 font-semibold mb-6">{org.category}</p>
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
                        <p className="font-bold text-gray-800">{members.length}</p>
                        <p className="text-sm text-gray-500">Members</p>
                    </div>
                </li>
                 <li className="flex items-center gap-4 text-lg">
                    <LeaderboardIcon className="h-8 w-8 text-green-500"/>
                    <div>
                        <p className="font-bold text-gray-800">#{orgRank}</p>
                        <p className="text-sm text-gray-500">Rank in {org.category}</p>
                    </div>
                </li>
             </ul>
        </div>
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
         <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Members ({members.length})</h3>
            {members.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {members.sort((a,b) => a.firstName.localeCompare(b.firstName)).map(member => (
                        <div key={member.id} onClick={() => setPageState({ page: 'profile', userId: member.id })} className="flex items-center gap-2 p-2 pr-4 bg-light-gray rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
                            <img 
                                src={member.profilePictureUrl || `https://i.pravatar.cc/150?u=${member.id}`} 
                                alt={`${member.firstName} ${member.lastName}`}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                            <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">This organization has no members yet.</p>
            )}
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
                <ul className="space-y-4">
                    {upcomingEvents.map(event => (
                        <li key={event.id} onClick={() => setPageState({ page: 'opportunityDetail', id: event.id })} className="p-4 rounded-lg bg-light-gray flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors">
                            <div>
                                <p className="font-bold text-gray-800">{event.title}</p>
                                <p className="text-sm text-gray-600">
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &bull; {event.organization}
                                </p>
                            </div>
                            <div className="text-center ml-4">
                                <p className="font-bold text-cornell-red">{event.attendingMemberCount}</p>
                                <p className="text-xs text-gray-500">Member{event.attendingMemberCount !== 1 ? 's' : ''}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No upcoming events with members from this organization.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;