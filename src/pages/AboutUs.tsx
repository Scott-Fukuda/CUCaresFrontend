import React, { useState } from 'react';
import { Member } from '../types';
import { ourTeam } from '../data/initialData';

interface AboutUsPageProps {
  setPageState: (state: any) => void;
}

const TeamMemberCard: React.FC<{ member: Member }> = ({ member }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 120; // Character limit for truncated text
  const shouldTruncate = member.favoriteService.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? member.favoriteService 
    : member.favoriteService.substring(0, maxLength) + '...';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="text-center">
        <div className="mb-4">
          {member.picture ? (
            <img
              src={member.picture}
              alt={member.name}
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-cornell-red/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-profile.png';
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-cornell-red/10 mx-auto flex items-center justify-center border-4 border-cornell-red/20">
              <span className="text-2xl font-bold text-cornell-red">
                {member.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
        <p className="text-cornell-red font-semibold mb-1">{member.major}</p>
        <p className="text-gray-600 text-sm mb-2">Class of {member.class}</p>
        <p className="text-gray-500 text-sm mb-3">📍 {member.hometown}</p>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Campus Organizations</h4>
          <div className="flex flex-wrap gap-1 justify-center">
            {member.campusOrgs.map((org, index) => (
              <span
                key={index}
                className="text-xs bg-cornell-red/10 text-cornell-red px-2 py-1 rounded-full font-medium"
              >
                {org}
              </span>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Favorite Service Experience</h4>
          <p className="text-sm text-gray-600 italic leading-relaxed mb-2">
            "{displayText}"
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-cornell-red hover:text-red-800 font-medium transition-colors duration-200"
            >
              {isExpanded ? 'See Less' : 'See More'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const AboutUsPage: React.FC<AboutUsPageProps> = ({ setPageState }) => {
  const teamMembers = ourTeam; // Get the team members array

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cornell-red text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About CampusCares</h1>
            <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto">
              Connecting Cornell students with meaningful service opportunities in the Ithaca community
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Mission Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-8"></div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-cornell-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-cornell-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Serving Ithaca</h3>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                Mission statement
              </p>
            
            </div>
          </div>
        </section>

        {/* Our Motivation Section */}
        {/* <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Motivation</h2>
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-8"></div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-20 h-20 bg-cornell-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-cornell-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Love others as God loved us</h3>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto mb-8">
                Our motivation comes from a deep belief in the power of love and service. We are inspired by the 
                call to love others as God has loved us - unconditionally, sacrificially, and with purpose. This 
                foundational principle drives everything we do at CU Cares.
              </p>
            </div>
          </div>
        </section> */}

        {/* Our Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-8"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Meet the team that makes CampusCares possible!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-cornell-red rounded-2xl shadow-lg p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Join thousands of Cornell students who are already making an impact in the Ithaca community.
            </p>
            <button
              onClick={() => setPageState({ page: 'opportunities' })}
              className="bg-white text-cornell-red px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-300"
            >
              Explore Opportunities
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;
