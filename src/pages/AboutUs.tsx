import React, { useState, useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Member, User } from '../types';
import { ourTeam } from '../data/initialData';

/**
 * Simplified Card: Square image with role and name.
 */
const SimplifiedMemberCard: React.FC<{ 
  member: Member; 
  isSelected: boolean;
  onClick: () => void 
}> = ({ member, isSelected, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-start text-left transition-all duration-300 hover:opacity-80 ${
      isSelected ? 'ring-2 ring-cornell-red ring-offset-4 rounded-lg' : ''
    }`}
  >
    <div className="w-full aspect-square bg-[#6b6b6b] rounded-lg mb-3 overflow-hidden shadow-sm">
      {member.picture && (
        <img 
          src={member.picture} 
          alt={member.name} 
          className="w-full h-full object-cover" 
        />
      )}
    </div>
    <h3 className="text-lg font-bold text-gray-900 leading-tight">{member.name}</h3>
    <p className="text-sm text-[#b94538] font-medium">{member.role}</p>
  </button>
);

/**
 * Expanded Profile: Comprehensive view using MUI Close icon.
 */
const ExpandedProfile: React.FC<{ 
  member: Member; 
  onClose: () => void 
}> = ({ member, onClose }) => (
  <div className="col-span-full bg-white rounded-xl p-8 mb-10 relative flex flex-col md:flex-row gap-8 shadow-md border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
    <button 
      onClick={onClose} 
      className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
      aria-label="Close profile"
    >
      <CloseIcon sx={{ fontSize: 28 }} />
    </button>
    
    <div className="w-full md:w-64 flex-shrink-0">
      {/* Updated Image Container */}
      <div className="aspect-square bg-[#6b6b6b] rounded-lg mb-4 shadow-sm overflow-hidden">
        {member.picture ? (
          <img 
            src={member.picture} 
            alt={member.name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-profile.png'; // Fallback if image fails to load
            }}
          />
        ) : (
          /* Fallback initials if no picture exists */
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 leading-tight">{member.name}</h2>
      <p className="text-lg text-[#b94538] font-semibold">{member.role}</p>
    </div>

    <div className="flex-grow">
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm md:text-base border-b pb-4 border-gray-200">
        <p><span className="font-bold">Major:</span> {member.major}</p>
        <p><span className="font-bold">Year:</span> {member.class}</p>
        <p><span className="font-bold">Hometown:</span> {member.hometown}</p>
      </div>
      
      <div className="mb-6">
        <h4 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wider">Campus involvements:</h4>
        <p className="text-gray-700">{member.campusOrgs.join(', ')}</p>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wider">Favorite service experience:</h4>
        <p className="text-gray-700 leading-relaxed italic">
          "{member.favoriteService}"
        </p>
      </div>
    </div>
  </div>
);

interface AboutUsProps {
  currentUser: User | null;
}

const AboutUsPage: React.FC<AboutUsProps> = ({ currentUser }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Full Team');

  const departments = ['Full Team', 'Business Development', 'Marketing', 'Outreach', 'Tech'];
  
  const filteredDepartments = useMemo(() => {
    const categories = ['Business Development', 'Marketing', 'Outreach', 'Tech'];
    if (activeTab === 'Full Team') {
      return categories.map(dept => ({
        name: dept,
        members: ourTeam.filter(m => m.department === dept)
      }));
    }
    return [{
      name: activeTab,
      members: ourTeam.filter(m => m.department === activeTab)
    }];
  }, [activeTab]);

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
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                    We believe in the power of service to transform communities, build friendships,
                    and cultivate unity. We seek to catalyze change by equipping students with
                    service opportunities to build a community we are proud of, demonstrating that
                    our campus cares.
                  </p>
                  <br />
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                    We began as a group of Christian students looking for ways to build community
                    around volunteering. Driven by faith-based values of love and kindness, we
                    wanted to unite our campus in serving our community. That's why we started
                    CampusCares, an online platform to mobilize Cornell students to create genuine
                    social impact.
                  </p>
                  <br />
                  <p className="text-sm md:text-lg text-gray-700 leading-relaxed">
                    CampusCares connects you with a wide range of nonprofit partners—all in one
                    simple, free platform. You can discover causes you care about, help your student
                    organizations climb the leaderboard, and meet new friends through volunteering.
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
            <div className="w-24 h-1 bg-cornell-red mx-auto mb-12"></div>
          </div>

          {/* Department Tabs - Full Width Update */}
          <div className="mb-16">
            <div className="flex w-full bg-gray-100 p-1.5 rounded-full shadow-inner">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setActiveTab(dept);
                    setSelectedMemberId(null);
                  }}
                  className={`flex-1 px-2 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === dept 
                      ? 'bg-cornell-red text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
          
              {/* Departmental Groups */}
    {filteredDepartments.map((dept) => {
      // Group members into rows based on the current screen size (using 4 for desktop)
      // This logic ensures the expanded profile injects itself after the correct row
      const itemsPerRow = 4;
      const rows = [];
      for (let i = 0; i < dept.members.length; i += itemsPerRow) {
        rows.push(dept.members.slice(i, i + itemsPerRow));
      }

      return (
        <div key={dept.name} className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            {dept.name}
          </h3>
          
          <div className="flex flex-col gap-y-12">
            {rows.map((row, rowIndex) => {
              // Check if the selected member is in THIS specific row
              const selectedInRow = row.find(m => m.id === selectedMemberId);

              return (
                <React.Fragment key={rowIndex}>
                  {/* The Grid Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
                    {row.map((member) => (
                      <SimplifiedMemberCard 
                        key={member.id}
                        member={member}
                        isSelected={selectedMemberId === member.id}
                        onClick={() => setSelectedMemberId(member.id === selectedMemberId ? null : member.id)}
                      />
                    ))}
              </div>

              {/* The Injected Profile (Only if the member is in this row) */}
              {selectedInRow && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <ExpandedProfile 
                    member={selectedInRow} 
                    onClose={() => setSelectedMemberId(null)} 
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
})}
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-cornell-red rounded-2xl shadow-lg p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
            <button className="bg-white text-cornell-red px-10 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-md">
              Explore Opportunities
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-8">
            Click here to see our{' '}
            <a href="/terms_of_service.pdf" className="underline hover:text-gray-700">
              Terms of Service and Privacy Policy
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;