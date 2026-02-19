import { useEffect, useState } from "react";
import { Save, User, Mail, Phone, MapPin, Building, Badge, Briefcase, Shield, Clock, Activity, ChevronDown } from "lucide-react";
import { membersAPI, type ProfileData, type EditProfileData, type ActivityLog } from "./../../../api/members/index.ts";

// Skeleton Loaders
function ProfileSkeleton() {
  return (
    <div className="p-6 mx-auto bg-white rounded-lg max-w-7xl animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-48 h-8 bg-gray-200 rounded"></div>
        <div className="w-32 h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to display values
const displayValue = (value: string | null | undefined): string => {
  return value ? value : "Not provided";
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format activity log action
const formatAction = (action: string) => {
  return action.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper to format field names for display
const formatFieldName = (field: string): string => {
  return field.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Safe value display - prevents object rendering error
const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState<EditProfileData | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchActivityLogs();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const profileData = await membersAPI.getProfile();
      setProfile(profileData);
      setEditData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        member_id: profileData.member_id,
        work_email: profileData.work_email,
        address_line1: profileData.address_line1,
        address_line2: profileData.address_line2,
        city: profileData.city,
        state: profileData.state,
        zip_code: profileData.zip_code,
        home_email: profileData.home_email,
        home_phone: profileData.home_phone,
        self_id: profileData.self_id,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const logs = await membersAPI.getActivityLogs();
      setActivityLogs(logs);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      if (!editData) return;

      // Normalize data to fix TypeScript errors
      const updateData: EditProfileData = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        member_id: editData.member_id || undefined,
        work_email: editData.work_email || undefined,
        address_line1: editData.address_line1 || undefined,
        address_line2: editData.address_line2 || undefined,
        city: editData.city || undefined,
        state: editData.state || undefined,
        zip_code: editData.zip_code || undefined,
        home_email: editData.home_email || undefined,
        home_phone: editData.home_phone || undefined,
        self_id: editData.self_id || undefined,
      };
      
      const updatedProfile = await membersAPI.updateProfile(updateData);
      setProfile(updatedProfile);
      
      // Refresh activity logs after update
      fetchActivityLogs();
      
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: keyof EditProfileData, value: string) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const InputField = ({ label, value, onChange, type = "text", required = false, as = "input" }: any) => (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      ) : as === "select" ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {type === "state" ? (
            <>
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
              <option value="DC">District of Columbia</option>
            </>
          ) : (
            <>
              <option value="">Select Identity</option>
              <option value="Asian or Pacific Islander">Asian or Pacific Islander</option>
              <option value="Biracial or Multiracial">Biracial or Multiracial</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Latin (a/o/x) or Hispanic">Latin (a/o/x) or Hispanic</option>
              <option value="MENA (Middle Eastern or North African)">MENA (Middle Eastern or North African)</option>
              <option value="Native American or Alaska Native">Native American or Alaska Native</option>
              <option value="White or Caucasian">White or Caucasian</option>
              <option value="None of the provided options">None of the provided options</option>
              <option value="I choose not to identify">I choose not to identify</option>
            </>
          )}
        </select>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-3 py-2 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}
    </div>
  );

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Information</h1>
              <p className="mt-1 text-gray-600">Manage your personal details and contact information</p>
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={updating}
              className="flex items-center gap-2 px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              <Save size={18} />
              {updating ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 mb-6 text-green-700 border border-green-200 rounded-lg bg-green-50">
            {success}
          </div>
        )}

        {profile && editData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Editable Information */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                  <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                    <User className="w-5 h-5 text-gray-600" />
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="First Name"
                      value={editData.first_name}
                      onChange={(value: string) => handleInputChange('first_name', value)}
                      required
                    />
                    <InputField
                      label="Last Name"
                      value={editData.last_name}
                      onChange={(value: string) => handleInputChange('last_name', value)}
                      required
                    />
                    <InputField
                      label="Member ID"
                      value={editData.member_id}
                      onChange={(value: string) => handleInputChange('member_id', value)}
                    />
                    <InputField
                      label="Work Email"
                      value={editData.work_email}
                      onChange={(value: string) => handleInputChange('work_email', value)}
                      type="email"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                  <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                    <Mail className="w-5 h-5 text-gray-600" />
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      label="Home Email"
                      value={editData.home_email}
                      onChange={(value: string) => handleInputChange('home_email', value)}
                      type="email"
                    />
                    <InputField
                      label="Home Phone"
                      value={editData.home_phone}
                      onChange={(value: string) => handleInputChange('home_phone', value)}
                      type="tel"
                    />
                    <div className="md:col-span-2">
                      <InputField
                        label="Self Identification"
                        value={editData.self_id}
                        onChange={(value: string) => handleInputChange('self_id', value)}
                        as="select"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg">
                  <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    Address Information
                  </h2>
                  <div className="space-y-4">
                    <InputField
                      label="Address Line 1"
                      value={editData.address_line1}
                      onChange={(value: string) => handleInputChange('address_line1', value)}
                    />
                    <InputField
                      label="Address Line 2"
                      value={editData.address_line2}
                      onChange={(value: string) => handleInputChange('address_line2', value)}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputField
                        label="City"
                        value={editData.city}
                        onChange={(value: string) => handleInputChange('city', value)}
                      />
                      <InputField
                        label="State"
                        value={editData.state}
                        onChange={(value: string) => handleInputChange('state', value)}
                        as="select"
                        type="state"
                        required
                      />
                      <InputField
                        label="ZIP Code"
                        value={editData.zip_code}
                        onChange={(value: string) => handleInputChange('zip_code', value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Professional Information & Activity Logs */}
            <div className="lg:col-span-1">
              {/* Professional Information */}
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <Shield className="w-5 h-5 text-gray-600" />
                  Professional Information
                </h2>
                <div className="space-y-1">
                  <InfoField 
                    label="Affiliation" 
                    value={safeDisplayValue(profile.affiliate?.name)} 
                  />
                  <InfoField 
                    label="Level" 
                    value={safeDisplayValue(profile.level)} 
                  />
                  <InfoField 
                    label="Employment Status" 
                    value={safeDisplayValue(profile.employment_status)} 
                  />
                  <InfoField 
                    label="Account Status" 
                    value={safeDisplayValue(profile.status)} 
                  />
                  <InfoField 
                    label="Member Since" 
                    value={profile.created_at ? formatDate(profile.created_at) : "Not available"} 
                  />
                  <InfoField 
                    label="Last Updated" 
                    value={profile.updated_at ? formatDate(profile.updated_at) : "Not available"} 
                  />
                </div>
              </div>

              {/* Activity Logs - COMMENTED OUT */}
              {/*
              <div className="p-6 mt-6 bg-white border border-gray-200 rounded-lg">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <Activity className="w-5 h-5 text-gray-600" />
                  Recent Activity
                </h2>
                
                <div className="space-y-3 overflow-y-auto max-h-80">
                  {activityLogs.length > 0 ? (
                    activityLogs.slice(0, 10).map((log) => (
                      <details key={log.id} className="group">
                        <summary className="flex items-center justify-between p-3 list-none transition-colors border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {formatAction(log.action)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              IP: {log.ip_address}
                            </div>
                          </div>
                          <ChevronDown className="flex-shrink-0 w-4 h-4 ml-2 text-gray-500 transition-transform transform group-open:rotate-180" />
                        </summary>
                        
                        <div className="p-3 mt-2 bg-white border border-gray-200 rounded-lg">
                          <div className="space-y-2 text-sm">
                            {Object.keys(log.new_values || {}).length > 0 ? (
                              Object.entries(log.new_values || {}).map(([field, newValue]) => {
                                const oldValue = log.old_values?.[field];
                                
                                // Skip if both values are empty/not provided
                                if ((!oldValue || oldValue === '' || oldValue === 'Not provided') && 
                                    (!newValue || newValue === '' || newValue === 'Not provided')) {
                                  return null;
                                }
                                
                                // Format values properly
                                const formatValue = (value: any): string => {
                                  if (!value) return '';
                                  if (typeof value === 'object') {
                                    // Handle user objects
                                    if (value.name || value.email) {
                                      return value.name || value.email || `User ${value.id}`;
                                    }
                                    // Handle affiliate objects
                                    if (value.name && value.id) {
                                      return `${value.name} (ID: ${value.id})`;
                                    }
                                    return JSON.stringify(value);
                                  }
                                  if (typeof value === 'string' && value.startsWith('{')) {
                                    try {
                                      const parsed = JSON.parse(value);
                                      if (parsed.name || parsed.email) {
                                        return parsed.name || parsed.email || `User ${parsed.id}`;
                                      }
                                      if (parsed.name && parsed.id) {
                                        return `${parsed.name} (ID: ${parsed.id})`;
                                      }
                                    } catch {
                                      // Not JSON, return as is
                                    }
                                  }
                                  return value;
                                };

                                const formattedOldValue = formatValue(oldValue);
                                const formattedNewValue = formatValue(newValue);
                                
                                return (
                                  <div key={field} className="flex items-start justify-between py-1">
                                    <span className="text-xs font-medium text-gray-700 capitalize">
                                      {formatFieldName(field)}:
                                    </span>
                                    <div className="max-w-xs ml-4 text-right">
                                      {formattedOldValue && formattedOldValue !== '' && formattedOldValue !== 'Not provided' && (
                                        <div className="mb-1 text-xs text-gray-500 line-through break-words">
                                          {formattedOldValue}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-900 break-words">
                                        {formattedNewValue && formattedNewValue !== '' && formattedNewValue !== 'Not provided' 
                                          ? formattedNewValue 
                                          : '(removed)'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }).filter(Boolean)
                            ) : (
                              <div className="py-2 text-xs text-center text-gray-500">
                                No changes recorded
                              </div>
                            )}
                          </div>
                        </div>
                      </details>
                    ))
                  ) : (
                    <div className="py-8 text-sm text-center text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>

                {activityLogs.length > 10 && (
                  <button className="w-full p-2 mt-4 text-sm font-medium text-blue-600 transition-colors border border-gray-200 rounded-lg hover:text-blue-800 hover:bg-gray-50">
                    View All Activity ({activityLogs.length})
                  </button>
                )}
              </div>
              */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}