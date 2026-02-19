// src/components/dashboards/member/components/Profile.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabaseClient';

interface ProfileData {
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  work_phone?: string;
  home_email?: string;
  home_phone?: string;
  self_id?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('members')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Profile not found</h3>
        <p className="text-red-600 text-sm">Please contact your affiliate administrator</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.includes('success') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
        {/* Personal Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={profile.level}
                onChange={(e) => handleChange('level', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Associate">Associate</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Status
              </label>
              <select
                value={profile.employment_status}
                onChange={(e) => handleChange('employment_status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Phone
              </label>
              <input
                type="tel"
                value={profile.work_phone || ''}
                onChange={(e) => handleChange('work_phone', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Email
              </label>
              <input
                type="email"
                value={profile.home_email || ''}
                onChange={(e) => handleChange('home_email', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Phone
              </label>
              <input
                type="tel"
                value={profile.home_phone || ''}
                onChange={(e) => handleChange('home_phone', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Address Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={profile.address_line1 || ''}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={profile.address_line2 || ''}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={profile.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={profile.zip_code || ''}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Self Identification */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Self Identification</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How do you identify?
            </label>
            <select
              value={profile.self_id || ''}
              onChange={(e) => handleChange('self_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asian or Pacific Islander">Asian or Pacific Islander</option>
              <option value="Biracial or Multiracial">Biracial or Multiracial</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Latin (a/o/x) or Hispanic">Latin (a/o/x) or Hispanic</option>
              <option value="MENA (Middle Eastern or North African)">MENA (Middle Eastern or North African)</option>
              <option value="Native American or Alaska Native">Native American or Alaska Native</option>
              <option value="White or Caucasian">White or Caucasian</option>
              <option value="None of the provided options">None of the provided options</option>
              <option value="I choose not to identify">I choose not to identify</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}