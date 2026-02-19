import React from 'react';

const ProfileCard: React.FC = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          NA
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">National Administrator</h2>
          <p className="text-sm text-gray-500">admin@nso.org</p>
          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            National Level
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">82</div>
          <div className="text-xs text-gray-500">Affiliates</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">4,231</div>
          <div className="text-xs text-gray-500">Members</div>
        </div>
      </div>
      
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
        Edit Profile
      </button>
    </div>
  );
};

export default ProfileCard;