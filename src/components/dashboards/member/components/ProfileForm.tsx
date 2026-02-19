// src/components/dashboards/member/components/ProfileForm.tsx
import React, { useState, useEffect } from 'react';

interface Profile {
  id: number;
  user_id: number;
  affiliate_id: number;
  member_id: string;
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  work_email: string;
  work_phone: string;
  work_fax: string;
  home_email: string;
  home_phone: string;
  self_id: string;
  non_nso: boolean;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
  };
  affiliate: {
    name: string;
  };
}

interface ProfileFormProps {
  profile: Profile;
  onSubmit: (formData: any) => void;
  readOnlyFields: string[];
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSubmit, readOnlyFields }) => {
  const [formData, setFormData] = useState({
    home_email: '',
    home_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    self_id: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        home_email: profile.home_email || '',
        home_phone: profile.home_phone || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        self_id: profile.self_id || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const isReadOnly = (fieldName: string) => readOnlyFields.includes(fieldName);

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC'
  ];

  const selfIdOptions = [
    'Asian or Pacific Islander',
    'Biracial or Multiracial',
    'Black or African American',
    'Latin (a/o/x) or Hispanic',
    'MENA (Middle Eastern or North African)',
    'Native American or Alaska Native',
    'White or Caucasian',
    'None of the provided options',
    'I choose not to identify'
  ];

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only information section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Member ID</label>
          <input
            type="text"
            value={profile.member_id || 'Not assigned'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Affiliate</label>
          <input
            type="text"
            value={profile.affiliate?.name || 'Not assigned'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            value={profile.first_name}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            type="text"
            value={profile.last_name}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Level</label>
          <input
            type="text"
            value={profile.level || 'Not specified'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Employment Status</label>
          <input
            type="text"
            value={profile.employment_status || 'Not specified'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Work Email</label>
          <input
            type="email"
            value={profile.work_email || 'Not specified'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Work Phone</label>
          <input
            type="tel"
            value={profile.work_phone || 'Not specified'}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-50"
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Editable information section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Home Email</label>
            <input
              type="email"
              name="home_email"
              value={formData.home_email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter home email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Home Phone</label>
            <input
              type="tel"
              name="home_phone"
              value={formData.home_phone}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter home phone"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Home Address</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
            <input
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter street address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
            <input
              type="text"
              name="address_line2"
              value={formData.address_line2}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Apartment, suite, etc."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter city"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Self Identification</label>
          <select
            name="self_id"
            value={formData.self_id}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select an option</option>
            {selfIdOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            This information helps us better understand and serve our diverse membership.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;