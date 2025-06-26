import React from 'react';
import TeamDetailComponent from '../components/TeamDetail';
import usePageTitle from '../hooks/usePageTitle';

const TeamDetail: React.FC = () => {
  usePageTitle('Team Details');
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TeamDetailComponent />
      </div>
    </div>
  );
};

export default TeamDetail;