import React, { useState } from 'react';
import { Opportunity, User } from '../../types';
import { FriendsGoingOpportunity } from '../../hooks/useFriendsGoingOpportunities';
import FriendAvatarStack from './FriendAvatarStack';

const INITIAL_COUNT = 3;

interface FriendsGoingSectionProps {
  rankedOpportunities: FriendsGoingOpportunity[];
  /** Renders the card itself, so the section stays in sync with the main feed. */
  renderCard: (opportunity: Opportunity) => React.ReactNode;
}

const describeFriends = (friends: User[]): string => {
  const [first, second] = friends;
  if (friends.length === 1) return `${first.name} is going`;
  if (friends.length === 2) return `${first.name} and ${second.name} are going`;
  return `${first.name} and ${friends.length - 1} others are going`;
};

const FriendsGoingSection: React.FC<FriendsGoingSectionProps> = ({
  rankedOpportunities,
  renderCard,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Nothing to highlight — hide the section entirely rather than showing an empty state.
  if (rankedOpportunities.length === 0) return null;

  const visible = showAll ? rankedOpportunities : rankedOpportunities.slice(0, INITIAL_COUNT);
  const remaining = rankedOpportunities.length - INITIAL_COUNT;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
        Friends are going to these opportunities
      </h2>
      <p className="text-gray-600 mb-6">See where the people you know are volunteering.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visible.map(({ opportunity, friendsGoing }) => (
          <div key={`friends-opp-${opportunity.id}`} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <FriendAvatarStack friends={friendsGoing} />
              <span className="text-sm font-medium text-gray-700">
                {describeFriends(friendsGoing)}
              </span>
            </div>
            {renderCard(opportunity)}
          </div>
        ))}
      </div>

      {!showAll && remaining > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2 rounded-lg border border-cornell-red text-cornell-red font-semibold hover:bg-cornell-red hover:text-white transition-colors"
          >
            See more ({remaining})
          </button>
        </div>
      )}
    </section>
  );
};

export default FriendsGoingSection;
