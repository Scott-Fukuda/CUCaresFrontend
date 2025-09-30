import React, { useState } from 'react';
import { Member } from '../types';
import { ourTeam } from '../data/initialData';
import { useNavigate } from 'react-router-dom';

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
        <p className="text-cornell-red font-semibold mb-1">{member.role}</p>
        <p className="text-gray-600 font-medium mb-1">{member.major}</p>
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

const AboutUsPage: React.FC = () => {
  const teamMembers = ourTeam; // Get the team members array
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
            {/* Header Banner */}
            <div className="relative">
        <img 
          src="/banner3.jpeg" 
          alt="CampusCares Banner" 
          className="w-full h-48 md:h-64 lg:h-80 object-cover"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Mission Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-8"></div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-left">
              <div className="mb-8 flex flex-col md:flex-row md:items-start md:space-x-6 space-y-4 md:space-y-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-cornell-red/10 rounded-full flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-cornell-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  {/* <h3 className="text-2xl font-bold text-gray-900 mb-4">About CampusCares</h3> */}
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                  We believe in the power of service to transform communities, build friendships, and cultivate unity. 
                  We seek to catalyze change by equipping students with service opportunities to build a community we are proud of, demonstrating that our campus cares.
                  </p>
                  <br />
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                  We began as a group of Christian students looking for ways to build community around volunteering. 
                  Driven by faith-based values of love and kindness, we wanted to unite our campus in serving our community. 
                  That's why we started CampusCares, an online platform to mobilize Cornell students to create genuine social impact. 
                  </p>
                
                  <br />
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                  CampusCares connects you with a wide range of nonprofit partners—all in one simple, free platform. 
                  You can discover causes you care about, help your student organizations climb the leaderboard, and meet new friends through volunteering. 
                  We open doors to new opportunities, motivate you to stay involved, and help bridge the Cornell and Ithaca communities. 
                  We seek to support the bold missions of local organizations while empowering students to make a real difference.
                </p>
                
                </div>
              </div>
              
    
            
            </div>
          </div>
        </section>


        {/* Our Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-8"></div>
      
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
          
            <button
              onClick={() => navigate('/opportunities')}
              className="bg-white text-cornell-red px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-300">
              Explore Opportunities
            </button>
          </div>
        </section>
        <p className="text-xs text-gray-500 mt-6 text-center">
          Click here to see our {" "}
          <a
            href="/terms_of_service.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            Terms of Service and Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default AboutUsPage;
