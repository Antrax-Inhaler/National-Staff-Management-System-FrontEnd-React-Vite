import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import InputField from "./../../../ui/InputField";
import SelectField from "./../../../ui/SelectField";
import Badge from "./../../../ui/Badge";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  member_id?: string;
  level?: string;
  employment_status?: string;
  status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  work_email?: string;
  work_phone?: string;
  work_fax?: string;
  home_email?: string;
  home_phone?: string;
  self_id?: string;
  non_nso?: boolean;
  created_at?: string;
  updated_at?: string;
  affiliate?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    email: string;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  updater?: {
    id: number;
    name: string;
    email: string;
  };
}

interface EditProfileData {
  first_name: string;
  last_name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  home_email?: string | null;
  home_phone?: string | null;
  self_id?: string | null;
}

interface ValidationState {
  isValid: boolean;
  message: string;
  isChecking: boolean;
}

// US States array for dropdown
const US_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

// Self ID options
const SELF_ID_OPTIONS = [
  { value: '', label: 'Select Identity' },
  { value: 'Asian or Pacific Islander', label: 'Asian or Pacific Islander' },
  { value: 'Biracial or Multiracial', label: 'Biracial or Multiracial' },
  { value: 'Black or African American', label: 'Black or African American' },
  { value: 'Latin (a/o/x) or Hispanic', label: 'Latin (a/o/x) or Hispanic' },
  { value: 'MENA (Middle Eastern or North African)', label: 'MENA (Middle Eastern or North African)' },
  { value: 'Native American or Alaska Native', label: 'Native American or Alaska Native' },
  { value: 'White or Caucasian', label: 'White or Caucasian' },
  { value: 'None of the provided options', label: 'None of the provided options' },
  { value: 'I choose not to identify', label: 'I choose not to identify' }
];

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState<EditProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const [validationStates, setValidationStates] = useState({
    home_email: { isValid: false, message: "", isChecking: false },
    home_phone: { isValid: false, message: "", isChecking: false },
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setProfile(result.data);
      
      setEditData({
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        address_line1: result.data.address_line1,
        address_line2: result.data.address_line2,
        city: result.data.city,
        state: result.data.state,
        zip_code: result.data.zip_code,
        home_email: result.data.home_email,
        home_phone: result.data.home_phone,
        self_id: result.data.self_id,
      });
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  // Validation function for home_email and home_phone
  const validateField = async (field: string, value: string): Promise<ValidationState> => {
    if (debounceTimeouts.current[field]) {
      clearTimeout(debounceTimeouts.current[field]);
    }

    return new Promise((resolve) => {
      debounceTimeouts.current[field] = setTimeout(async () => {
        setValidationStates(prev => ({
          ...prev,
          [field]: { ...prev[field as keyof typeof prev], isChecking: true }
        }));

        let isValid = false;
        let message = "";

        switch (field) {
          case 'home_email':
            if (value && !/\S+@\S+\.\S+/.test(value)) {
              isValid = false;
              message = "Please enter a valid email address";
            } else if (value) {
              // Check uniqueness against members table
              const { data, error } = await supabase
                .from("members")
                .select("id, home_email")
                .eq("home_email", value.trim().toLowerCase())
                .limit(1);

              if (error) {
                isValid = false;
                message = "Error checking email availability";
              } else if (data && data.length > 0 && data[0].id !== profile?.id) {
                isValid = false;
                message = "Home email is already in use by another member";
              } else {
                isValid = true;
                message = "Email is available";
              }
            } else {
              isValid = true;
              message = "";
            }
            break;

          case 'home_phone':
            if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
              isValid = false;
              message = "Please enter a valid phone number";
            } else {
              isValid = true;
              message = value ? "Phone number format is valid" : "";
            }
            break;

          default:
            isValid = true;
            message = "";
        }

        const newState = { isValid, message, isChecking: false };
        setValidationStates(prev => ({ ...prev, [field]: newState }));
        resolve(newState);
      }, 500);
    });
  };

  const handleInputChange = (field: keyof EditProfileData, value: string) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
    setFormErrors(prev => ({ ...prev, [field]: [] }));
    setError("");

    if (['home_email', 'home_phone'].includes(field)) {
      validateField(field, value);
    }
  };

  // Validation icon component
  const ValidationIcon = ({ field }: { field: keyof typeof validationStates }) => {
    const state = validationStates[field];
    
    if (state.isChecking) {
      return <Loader size={16} className="text-gray-400 animate-spin" />;
    }
    
    if (state.message && !state.isChecking) {
      return state.isValid ? 
        <CheckCircle size={16} className="text-green-500" /> : 
        <XCircle size={16} className="text-red-500" />;
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (!editData?.first_name?.trim()) errors.first_name = ["First name is required"];
    if (!editData?.last_name?.trim()) errors.last_name = ["Last name is required"];

    // Email format validation
    if (editData?.home_email && !/\S+@\S+\.\S+/.test(editData.home_email)) {
      errors.home_email = ["Please enter a valid email address"];
    }

    // Phone validation
    if (editData?.home_phone && !/^[\+]?[1-9][\d]{0,15}$/.test(editData.home_phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.home_phone = ["Please enter a valid phone number"];
    }

    // ZIP code validation
    if (editData?.zip_code && !/^\d{5}(-\d{4})?$/.test(editData.zip_code)) {
      errors.zip_code = ["Please enter a valid ZIP code"];
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    try {
      if (!validateForm()) {
        setError("Please fix the validation errors before saving.");
        return;
      }

      setUpdating(true);
      setError("");
      setSuccess("");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const updateData = {
        first_name: editData?.first_name || "",
        last_name: editData?.last_name || "",
        address_line1: editData?.address_line1 || null,
        address_line2: editData?.address_line2 || null,
        city: editData?.city || null,
        state: editData?.state || null,
        zip_code: editData?.zip_code || null,
        home_email: editData?.home_email || null,
        home_phone: editData?.home_phone || null,
        self_id: editData?.self_id || null,
      };
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 422 && responseData.errors) {
          const errorMessages = Object.values(responseData.errors).flat().join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(responseData.message || "Failed to update profile");
      }

      setProfile(responseData.data);
      setEditData({
        first_name: responseData.data.first_name,
        last_name: responseData.data.last_name,
        address_line1: responseData.data.address_line1,
        address_line2: responseData.data.address_line2,
        city: responseData.data.city,
        state: responseData.data.state,
        zip_code: responseData.data.zip_code,
        home_email: responseData.data.home_email,
        home_phone: responseData.data.home_phone,
        self_id: responseData.data.self_id,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getErrorArray = (errorString: string | undefined): string[] => {
    return errorString ? [errorString] : [];
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader size={32} className="mx-auto mb-4 text-blue-600 animate-spin" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="p-6 mb-6 bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👤 Member Profile</h1>
              <p className="mt-1 text-gray-600">Manage your personal information and preferences</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 font-medium text-white transition duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
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
            {/* Left Column - Professional Information */}
            <div className="space-y-6 lg:col-span-2">
              {/* Professional Information */}
              <div className="p-6 bg-white shadow-sm rounded-xl">
                <h3 className="pb-3 mb-6 text-xl font-semibold text-gray-900 border-b">
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Member ID</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Badge variant="primary">{profile.member_id || "N/A"}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Affiliation</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.affiliate?.name || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Level</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Badge variant={profile.level === "Professional" ? "primary" : "success"}>
                        {profile.level || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Employment Status</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Badge variant={profile.employment_status === "Full Time" ? "warning" : "gray"}>
                        {profile.employment_status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Status</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Badge variant={profile.status === "Active" ? "success" : "danger"}>
                        {profile.status || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Non-NSO</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.non_ORG ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Contact Information */}
              <div className="p-6 bg-white shadow-sm rounded-xl">
                <h3 className="pb-3 mb-6 text-xl font-semibold text-gray-900 border-b">
                  Work Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Work Email</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.work_email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Work Phone</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.work_phone || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Work Fax</label>
                    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.work_fax || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="p-6 bg-white shadow-sm rounded-xl">
                <h3 className="pb-3 mb-6 text-xl font-semibold text-gray-900 border-b">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* First Name */}
                  <div className="relative">
                    <InputField
                      label="First Name *"
                      name="first_name"
                      value={editData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                      readOnly={!isEditing}
                      error={getErrorArray(formErrors.first_name?.[0])}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="relative">
                    <InputField
                      label="Last Name *"
                      name="last_name"
                      value={editData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                      readOnly={!isEditing}
                      error={getErrorArray(formErrors.last_name?.[0])}
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div className="md:col-span-2">
                    <InputField
                      label="Address Line 1"
                      name="address_line1"
                      value={editData.address_line1 || ""}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="md:col-span-2">
                    <InputField
                      label="Address Line 2"
                      name="address_line2"
                      value={editData.address_line2 || ""}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* City */}
                  <InputField
                    label="City"
                    name="city"
                    value={editData.city || ""}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    readOnly={!isEditing}
                  />

                  {/* State */}
                  <SelectField
                    label="State"
                    name="state"
                    value={editData.state || ""}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    options={US_STATES}
                    disabled={!isEditing}
                  />

                  {/* ZIP Code */}
                  <div className="relative">
                    <InputField
                      label="ZIP Code"
                      name="zip_code"
                      value={editData.zip_code || ""}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      readOnly={!isEditing}
                      error={getErrorArray(formErrors.zip_code?.[0])}
                    />
                  </div>

                  {/* Home Email */}
                  <div className="relative">
                    <InputField
                      label="Home Email"
                      name="home_email"
                      type="email"
                      value={editData.home_email || ""}
                      onChange={(e) => handleInputChange('home_email', e.target.value)}
                      readOnly={!isEditing}
                      error={getErrorArray(formErrors.home_email?.[0])}
                    />
                    {isEditing && (
                      <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                        <ValidationIcon field="home_email" />
                      </div>
                    )}
                    {validationStates.home_email.message && !validationStates.home_email.isChecking && (
                      <p className={`text-sm mt-1 ${validationStates.home_email.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {validationStates.home_email.message}
                      </p>
                    )}
                  </div>

                  {/* Home Phone */}
                  <div className="relative">
                    <InputField
                      label="Home Phone"
                      name="home_phone"
                      value={editData.home_phone || ""}
                      onChange={(e) => handleInputChange('home_phone', e.target.value)}
                      readOnly={!isEditing}
                      error={getErrorArray(formErrors.home_phone?.[0])}
                    />
                    {isEditing && (
                      <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                        <ValidationIcon field="home_phone" />
                      </div>
                    )}
                    {validationStates.home_phone.message && !validationStates.home_phone.isChecking && (
                      <p className={`text-sm mt-1 ${validationStates.home_phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {validationStates.home_phone.message}
                      </p>
                    )}
                  </div>

                  {/* Self Identification */}
                  <div className="md:col-span-2">
                    <SelectField
                      label="Ethnicity"
                      name="self_id"
                      value={editData.self_id || ""}
                      onChange={(e) => handleInputChange('self_id', e.target.value)}
                      options={SELF_ID_OPTIONS}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Audit Information */}
            <div className="space-y-6">
              {/* Audit Information */}
              <div className="p-6 bg-white shadow-sm rounded-xl">
                <h3 className="pb-3 mb-6 text-xl font-semibold text-gray-900 border-b">
                  Audit Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Created On</label>
                    <p className="text-gray-900">{formatDate(profile.created_at)}</p>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Created By</label>
                    <p className="text-gray-900">{profile.creator ? `${profile.creator.name} (${profile.creator.email})` : 'System'}</p>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Last Modified On</label>
                    <p className="text-gray-900">{formatDate(profile.updated_at)}</p>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Last Modified By</label>
                    <p className="text-gray-900">{profile.updater ? `${profile.updater.name} (${profile.updater.email})` : 'System'}</p>
                  </div>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="p-6 bg-white shadow-sm rounded-xl">
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">Save Changes</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          first_name: profile.first_name,
                          last_name: profile.last_name,
                          address_line1: profile.address_line1,
                          address_line2: profile.address_line2,
                          city: profile.city,
                          state: profile.state,
                          zip_code: profile.zip_code,
                          home_email: profile.home_email,
                          home_phone: profile.home_phone,
                          self_id: profile.self_id,
                        });
                        setFormErrors({});
                      }}
                      className="flex-1 px-4 py-3 font-medium text-gray-700 transition duration-200 bg-gray-300 rounded-lg hover:bg-gray-400"
                      disabled={updating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 px-4 py-3 font-medium text-white transition duration-200 bg-green-600 rounded-lg hover:bg-green-700"
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}