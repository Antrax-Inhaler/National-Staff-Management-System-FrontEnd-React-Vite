import { useEffect, useMemo, useState } from "react";
import {
  Save,
  User,
  Mail,
  MapPin,
  Shield,
  Camera,
  AlertCircle,
  X,
} from "lucide-react";
import {
  profile,
  type EditProfileData,
  type ProfileData,
} from "../api/profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ProfileRolesCard from "../components/profile/ProfileRolesCard";
import { useAuth } from "@v1/contexts/AuthContext";
import { formatDate, readableName } from "@v1/helpers/formatter";
import AlertMessage from "@v1/components/ui/AlertMessage";
import InputField from "@v1/components/ui/InputField";
import SelectField from "@v1/components/ui/SelectField";
import { safeDisplayValue } from "@v1/helpers/helper";
import { States } from "@v1/constants/states";

// Add CSS for pulsing animation
const pulseRingStyles = `
@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}

.animate-pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-color: #f59e0b !important;
  border-width: 2px;
  position: relative;
}

.animate-pulse-ring input,
.animate-pulse-ring select {
  border-color: #f59e0b !important;
}

.animate-pulse-ring::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 8px;
  background: linear-gradient(45deg, transparent, rgba(245, 158, 11, 0.1), transparent);
  z-index: -1;
}

/* Skeleton Loading Styles */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 1em;
  width: 100%;
  margin-bottom: 0.5rem;
}

.skeleton-text-sm {
  height: 0.875em;
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-avatar {
  width: 80px;
  height: 80px;
}

.skeleton-button {
  height: 44px;
  width: 140px;
}

.skeleton-info-field {
  height: 44px;
}
`;

// Skeleton components for specific sections
const ProfilePhotoSkeleton = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      <Camera className="w-5 h-5 text-gray-600" />
      Profile Photo
    </h2>
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="skeleton skeleton-avatar skeleton-circle" />
      </div>
      <div className="flex-1">
        <div className="skeleton skeleton-text" style={{ height: '40px' }} />
        <div className="skeleton skeleton-text-sm mt-2" style={{ width: '60%' }} />
      </div>
    </div>
  </div>
);

const BasicInfoSkeleton = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      <User className="w-5 h-5 text-gray-600" />
      Basic Information
    </h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-text-sm mb-2" style={{ width: '30%' }} />
          <div className="skeleton skeleton-text" style={{ height: '44px' }} />
        </div>
      ))}
    </div>
  </div>
);

const ContactInfoSkeleton = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      <Mail className="w-5 h-5 text-gray-600" />
      Contact Information
    </h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton skeleton-text-sm mb-2" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ height: '44px' }} />
        </div>
      ))}
    </div>
  </div>
);

const AddressInfoSkeleton = () => (
  <div className="p-6 mb-12 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      <MapPin className="w-5 h-5 text-gray-600" />
      Address Information
    </h2>
    <div className="space-y-4">
      <div>
        <div className="skeleton skeleton-text-sm mb-2" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ height: '44px' }} />
      </div>
      <div>
        <div className="skeleton skeleton-text-sm mb-2" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ height: '44px' }} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton skeleton-text-sm mb-2" style={{ width: '30%' }} />
            <div className="skeleton skeleton-text" style={{ height: '44px' }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfessionalInfoSkeleton = () => (
  <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      <Shield className="w-5 h-5 text-gray-600" />
      Professional Information
    </h2>
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-info-field" />
      ))}
    </div>
  </div>
);

const RolesCardSkeleton = () => (
  <div className="p-6 bg-white border border-gray-200 rounded-lg">
    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
      Officer Information
    </h2>
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ height: '60px' }} />
      ))}
    </div>
  </div>
);

// Main skeleton wrapper
const ProfileContentSkeleton = () => (
  <>
    <ProfilePhotoSkeleton />
    <BasicInfoSkeleton />
    <ContactInfoSkeleton />
    <AddressInfoSkeleton />
  </>
);

export default function Profile() {
  const [editData, setEditData] = useState<EditProfileData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState("");
  const [validationError, setValidationError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  // NEW STATES FOR PULSING FEATURE
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [pulsingFields, setPulsingFields] = useState<string[]>([]);
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState(false);
  const [missingFieldsCount, setMissingFieldsCount] = useState(0);

  const {
    data: profileData,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<ProfileData | null>({
    queryKey: ["profile"],
    queryFn: () => profile.info(),
    staleTime: Infinity,
  });

  // NEW: Query for missing data count
  const {
    data: missingDataInfo,
    isLoading: loadingMissingData,
    refetch: refetchMissingData,
  } = useQuery({
    queryKey: ["profile-missing-data"],
    queryFn: () => profile.missingDataCount(),
    enabled: !!profileData,
    staleTime: 0,
  });

  const {
    mutate: generateId,
    isPending: generating,
    error: generateError,
  } = useMutation({
    mutationFn: () => profile.generateID(),
    onSuccess: () => {
      refetch();
      refetchMissingData(); // Refresh missing data count
      setSuccess("Member ID generated!");
      setUpdating(false);
      // Hide alert if all fields are now filled
      if (missingDataInfo?.missing_count === 0) {
        setShowMissingFieldsAlert(false);
      }
    },
    onError: async (err: any) => {
      if (err?.errors) {
        console.log("errors", err.errors);
        setErrors(err.errors);
        const fields = Object.keys(err.errors)
          .map((key) => readableName(key))
          .join(", ");
        setValidationError(`Missing Fields (${fields})`);
      }
      setUpdating(false);
    },
  });

  const {
    mutate,
    isPending,
    error: updateError,
  } = useMutation({
    mutationFn: (payload: EditProfileData) => profile.update(payload),
    onSuccess: () => {
      refetch();
      refetchMissingData(); // Refresh missing data count
      setSuccess("Profile updated successfully!");
      setUpdating(false);
      // Hide alert if all fields are now filled
      if (missingDataInfo?.missing_count === 0) {
        setShowMissingFieldsAlert(false);
      }
    },
    onError: async (err: any) => {
      if (err?.errors) {
        console.log("errors", err.errors);
        setErrors(err.errors);
        const fields = Object.keys(err.errors)
          .map((key) => readableName(key))
          .join(", ");
        setValidationError(`Missing Fields (${fields})`);
      }
      setUpdating(false);
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: (file: File) => profile.uploadPhoto(file),
    onSuccess: () => {
      setSuccess("Profile photo uploaded successfully!");
      setPhotoUploading(false);
      setProfilePhoto(null);
      refetch();
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to upload profile photo");
      setPhotoUploading(false);
    },
  });

  const photoDeleteMutation = useMutation({
    mutationFn: () => profile.deletePhoto(),
    onSuccess: () => {
      setSuccess("Profile photo deleted successfully!");
      refetch();
    },
    onError: (err: any) => {
      setValidationError(err?.message || "Failed to delete profile photo");
    },
  });

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      setSuccess("");
      if (!editData) return;

      const updateData: EditProfileData = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        member_id: editData.member_id ?? undefined,
        work_email: editData.work_email ?? undefined,
        address_line1: editData.address_line1 ?? undefined,
        address_line2: editData.address_line2 ?? undefined,
        city: editData.city ?? undefined,
        state_id: editData.state_id ?? undefined,
        state: editData.state ?? undefined,
        zip_code: editData.zip_code ?? undefined,
        mobile_phone: editData.mobile_phone ?? undefined,
        home_phone: editData.home_phone ?? undefined,
        date_of_birth: editData.date_of_birth ?? undefined,
        gender: editData.gender ?? undefined,
        self_id: editData.self_id ?? undefined,
      };

      mutate(updateData);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => (prev ? { ...prev, [name]: value } : prev));
    setErrors((prev) => ({ ...prev, [name]: [] }));

    // Stop pulsing when user starts typing in a missing field
    if (pulsingFields.includes(name)) {
      setPulsingFields((prev) => prev.filter((field) => field !== name));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError("File size must be less than 5MB");
        return;
      }
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setValidationError(
          "Please select a valid image file (JPG, PNG, GIF, or WEBP)"
        );
        return;
      }
      setProfilePhoto(file);
      setValidationError("");
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) return;

    try {
      setPhotoUploading(true);
      setValidationError("");
      await photoUploadMutation.mutateAsync(profilePhoto);
    } catch (error: any) {
      setValidationError(error?.message || "Failed to upload profile photo");
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      setValidationError("");
      await photoDeleteMutation.mutateAsync();
    } catch (error) {
      console.error("Photo delete error:", error);
    }
  };

  const handleCancelUpload = () => {
    setProfilePhoto(null);
    setValidationError("");
  };
  
  // Field name mapping for display
  const getFieldDisplayName = (field: string): string => {
    const fieldMap: Record<string, string> = {
      member_id: "Membership ID",
      first_name: "First Name",
      last_name: "Last Name",
      work_email: "Email Address",
      address_line1: "Street Address",
      city: "City",
      state: "State",
      zip_code: "ZIP Code",
      mobile_phone: "Mobile Phone",
      gender: "Gender",
      self_id: "Ethnicity", // CHANGED: Self Identification to Ethnicity
      home_phone: "Home Phone",
      date_of_birth: "Date of Birth",
      address_line2: "Address Line 2",
    };

    return (
      fieldMap[field] ||
      field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  };

  // NEW: Function to start pulsing animation for missing fields
  const startPulsingMissingFields = (fields: string[]) => {
    setMissingFields(fields);
    setPulsingFields([...fields]);
    setMissingFieldsCount(fields.length);

    // Show alert message
    setShowMissingFieldsAlert(true);

    // Start pulsing animation
    fields.forEach((field, index) => {
      setTimeout(() => {
        setPulsingFields((prev) => {
          const newFields = [...prev];
          if (!newFields.includes(field)) {
            newFields.push(field);
          }
          return newFields;
        });
      }, index * 200); // Stagger the pulses
    });

    // Stop pulsing after 5 seconds
    setTimeout(() => {
      setPulsingFields([]);
    }, 5000);
  };

  // NEW: Effect to check for missing fields when profile loads
  useEffect(() => {
    if (missingDataInfo?.success && missingDataInfo.missing_count > 0) {
      const requiredMissingFields = missingDataInfo.missing_fields || [];
      if (requiredMissingFields.length > 0) {
        // Wait a bit for the page to load, then start pulsing
        const timer = setTimeout(() => {
          startPulsingMissingFields(requiredMissingFields);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [missingDataInfo]);

  // NEW: Effect to update editData when profileData loads
  useEffect(() => {
    if (profileData) {
      setEditData({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        member_id: profileData.member_id ?? undefined,
        work_email: profileData.work_email ?? undefined,
        address_line1: profileData.address_line1 ?? undefined,
        address_line2: profileData.address_line2 ?? undefined,
        city: profileData.city ?? undefined,
        state: profileData.state ?? undefined,
        state_id: profileData.state_id ?? undefined,
        zip_code: profileData.zip_code ?? undefined,
        mobile_phone: profileData.mobile_phone ?? undefined,
        home_phone: profileData.home_phone ?? undefined,
        date_of_birth: profileData.date_of_birth ?? undefined,
        date_of_hire: profileData.date_of_hire ?? undefined,
        gender: profileData.gender ?? undefined,
        self_id: profileData.self_id ?? undefined,
      });
    }
  }, [profileData]);

  // Add CSS to head
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = pulseRingStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );

  // Get user initials for default avatar
  const getUserInitials = () => {
    if (!profileData) return "U";
    const firstInitial = profileData.first_name?.charAt(0) || "";
    const lastInitial = profileData.last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  // UPDATED: Changed label to "Ethnicity" and updated options
  const selfIdOptions = [
    { label: "Asian Or Pacific Islander", value: "Asian Or Pacific Islander" },
    { label: "Biracial or Multiracial", value: "Biracial or Multiracial" },
    { label: "Latin (a/o/x) or Hispanic", value: "Latin (a/o/x) or Hispanic" },
    {
      label: "MENA (Middle Eastern or North African)",
      value: "MENA (Middle Eastern or North African)",
    },
    {
      label: "Native American or Alaska Native",
      value: "Native American or Alaska Native",
    },
    { label: "White or Caucasian", value: "White or Caucasian" },
    { label: "Black or African American", value: "Black or African American" },
    {
      label: "None of the provided options",
      value: "None of the provided options",
    },
    { label: "I choose not to identify", value: "I choose not to identify" },
  ];

  const PRIORITY_SECOND = "I choose not to identify";
  const PRIORITY_LAST = "None of the provided options";

  const sortedSelfIdOptions = useMemo(() => {
    const [defaultOption, ...rest] = selfIdOptions;

    let second = null;
    let last = null;
    const middle = [];

    for (const opt of rest) {
      if (opt.value === PRIORITY_SECOND) second = opt;
      else if (opt.value === PRIORITY_LAST) last = opt;
      else middle.push(opt);
    }

    middle.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
    );

    return [defaultOption, second, ...middle, last].filter(Boolean);
  }, []);

  // UPDATED: Gender options with new choices
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Non-binary", value: "non-binary" },
    { label: "None of these choices", value: "none_of_these_choices" },
    { label: "Prefer not to disclose", value: "prefer_not_to_disclose" },
  ];

  // NEW: Render the missing fields alert
  const renderMissingFieldsAlert = () => {
    if (!showMissingFieldsAlert || missingFieldsCount === 0) return null;

    const fieldNames = missingFields
      .map((field) => getFieldDisplayName(field))
      .join(", ");

    return (
      <div className="fixed z-50 w-full max-w-2xl px-4 transform -translate-x-1/2 top-20 left-1/2">
        <div className="p-4 mb-6 border rounded-lg shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-amber-900">
                  Please complete your profile information
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  You have{" "}
                  <span className="font-semibold">
                    {missingFieldsCount} required field
                    {missingFieldsCount > 1 ? "s" : ""}
                  </span>{" "}
                  that need to be filled: {fieldNames}
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  The fields are highlighted with a pulsing border below. Please
                  fill them in to complete your profile.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMissingFieldsAlert(false)}
              className="p-1 transition-colors text-amber-500 hover:text-amber-700"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main loading state - show only basic structure with skeletons for content
  const isLoading = loading || !profileData || !editData;

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Missing Fields Alert - NEW */}
        {!isLoading && renderMissingFieldsAlert()}

        {/* Header - Always shows immediately */}
        <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Information
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your personal details and contact information
              </p>
            </div>
            {isLoading ? (
              <div className="skeleton skeleton-button" />
            ) : (
              <button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="flex items-center gap-2 px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                <Save size={18} />
                {updating ? "Saving Changes..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {(error || updateError) && (
          <AlertMessage
            type="error"
            message={validationError || "Failed to Update"}
          />
        )}

        {success && <AlertMessage type="success" message={success} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Editable Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {isLoading ? (
                <ProfileContentSkeleton />
              ) : profileData && editData ? (
                <>
                  {/* Profile Photo Upload */}
                  <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                      <Camera className="w-5 h-5 text-gray-600" />
                      Profile Photo
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-20 h-20 overflow-hidden bg-gray-200 rounded-full">
                          {profileData.photo_url ? (
                            <>
                              <img
                                src={profileData.photo_url}
                                alt="Profile"
                                className="object-cover w-20 h-20 rounded-full"
                              />
                            </>
                          ) : (
                            // Show only default avatar when no photo
                            <div className="flex items-center justify-center w-20 h-20 font-medium text-white bg-indigo-500 rounded-full">
                              {getUserInitials()}
                            </div>
                          )}
                        </div>
                        {profileData.photo_url && (
                          <button
                            onClick={handlePhotoDelete}
                            disabled={photoDeleteMutation.isPending}
                            className="absolute p-1 text-white bg-red-500 rounded-full -top-1 -right-1 hover:bg-red-600 disabled:bg-red-300"
                            title="Delete photo"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          disabled={photoUploading}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG, GIF, or WEBP (Max 5MB)
                        </p>
                        {validationError && (
                          <p className="mt-1 text-xs text-red-500">
                            {validationError}
                          </p>
                        )}
                        {profilePhoto && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={handlePhotoUpload}
                              disabled={photoUploading}
                              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                            >
                              {photoUploading ? "Uploading..." : "Upload Photo"}
                            </button>
                            <button
                              onClick={handleCancelUpload}
                              className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

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
                        name="first_name"
                        onChange={handleChange}
                        error={errors.first_name}
                        required
                        className={
                          pulsingFields.includes("first_name")
                            ? "animate-pulse-ring"
                            : ""
                        }
                      />
                      <InputField
                        label="Last Name"
                        value={editData.last_name}
                        name="last_name"
                        onChange={handleChange}
                        error={errors.last_name}
                        required
                        className={
                          pulsingFields.includes("last_name")
                            ? "animate-pulse-ring"
                            : ""
                        }
                      />
                      <InputField
                        label="Personal Email"
                        name="work_email"
                        value={editData.work_email ?? ""}
                        onChange={handleChange}
                        type="email"
                        error={errors.work_email}
                        placeholder="No work email addresses"
                        required
                        className={
                          pulsingFields.includes("work_email")
                            ? "animate-pulse-ring"
                            : ""
                        }
                      />
                      {/* TEMPORARILY NON-REQUIRED */}
                      <InputField
                        label="Date of Birth"
                        name="date_of_birth"
                        value={editData.date_of_birth ?? ""}
                        onChange={handleChange}
                        type="date"
                        error={errors.date_of_birth}
                      />
                      {/* UPDATED: New gender options */}
                      <SelectField
                        label="Gender"
                        name="gender"
                        value={editData.gender ?? ""}
                        onChange={handleChange}
                        options={genderOptions}
                        error={errors.gender}
                        // TEMPORARILY NON-REQUIRED: removed required prop
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
                        label="Mobile Phone"
                        name="mobile_phone"
                        value={editData.mobile_phone ?? ""}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Enter your mobile number"
                        error={errors.mobile_phone}
                        required
                        className={
                          pulsingFields.includes("mobile_phone")
                            ? "animate-pulse-ring"
                            : ""
                        }
                      />
                      <InputField
                        label="Home Phone"
                        name="home_phone"
                        value={editData.home_phone ?? ""}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Enter your home phone"
                        error={errors.home_phone}
                      />
                      <div className="md:col-span-2">
                        {/* UPDATED: Changed label to "Ethnicity" */}
                        <SelectField
                          label="Ethnicity"
                          name="self_id"
                          error={errors.self_id}
                          value={editData.self_id ?? ""}
                          onChange={handleChange}
                          // TEMPORARILY NON-REQUIRED: removed required prop
                          options={sortedSelfIdOptions}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="p-6 mb-12 bg-white border border-gray-200 rounded-lg">
                    <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      Address Information
                    </h2>
                    <div className="space-y-4">
                      <InputField
                        label="Address Line 1"
                        name="address_line1"
                        value={editData.address_line1 ?? ""}
                        onChange={handleChange}
                        error={errors.address_line1}
                        required
                        className={
                          pulsingFields.includes("address_line1")
                            ? "animate-pulse-ring"
                            : ""
                        }
                      />
                      <InputField
                        label="Address Line 2"
                        name="address_line2"
                        value={editData.address_line2 ?? ""}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <SelectField
                          label="State"
                          name="state"
                          value={editData?.state}
                          onChange={handleChange}
                          options={[
                            { label: "Select State", value: "" },
                            ...Object.entries(States).map(([abbr, name]) => ({
                              label: name,
                              value: name,
                            })),
                          ]}
                          error={errors.state}
                          required
                          className={
                            pulsingFields.includes("state")
                              ? "animate-pulse-ring"
                              : ""
                          }
                        />

                        <InputField
                          label="City"
                          name="city"
                          value={editData?.city ?? ""}
                          onChange={handleChange}
                          error={errors.city}
                          required
                          className={
                            pulsingFields.includes("city")
                              ? "animate-pulse-ring"
                              : ""
                          }
                        />

                        <InputField
                          label="ZIP Code"
                          name="zip_code"
                          value={editData.zip_code ?? ""}
                          onChange={handleChange}
                          error={errors.zip_code}
                          required
                          className={
                            pulsingFields.includes("zip_code")
                              ? "animate-pulse-ring"
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right Column - Professional Information */}
          <div className="lg:col-span-1">
            {/* Professional Information */}
            {isLoading ? (
              <>
                <ProfessionalInfoSkeleton />
                <RolesCardSkeleton />
              </>
            ) : profileData ? (
              <>
                <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg">
                  <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                    <Shield className="w-5 h-5 text-gray-600" />
                    Professional Information
                  </h2>
                  <div className="space-y-1">
                    {profileData.member_id ? (
                      <InfoField
                        label="Member ID"
                        value={safeDisplayValue(profileData.member_id)}
                      />
                    ) : (
                      <div className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600">
                          Member ID
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-900">
                            Not Provided
                          </span>

                          <button
                            disabled={generating}
                            onClick={() => generateId()}
                            type="button"
                            className="
                            inline-flex items-center
                            rounded-md border border-blue-200
                            bg-blue-50 px-3 py-1.5
                            text-xs font-medium text-blue-600
                            hover:bg-blue-100 hover:border-blue-300
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                            transition
                          "
                          >
                            {generating ? "Generating" : "Generate"} ID
                          </button>
                        </div>
                      </div>
                    )}
                    <InfoField
                      label="Date of Hire"
                      value={
                        profileData.date_of_hire
                          ? formatDate(profileData.date_of_hire)
                          : "Not available"
                      }
                    />
                    <InfoField
                      label="Affiliation"
                      value={safeDisplayValue(profileData.affiliate?.name)}
                    />
                    <InfoField
                      label="Level"
                      value={safeDisplayValue(profileData.level)}
                    />
                    <InfoField
                      label="Employment Status"
                      value={safeDisplayValue(profileData.employment_status)}
                    />
                    <InfoField
                      label="Account Status"
                      value={safeDisplayValue(profileData.status)}
                    />
                    <InfoField
                      label="Record Created"
                      value={
                        profileData.created_at
                          ? formatDate(profileData.created_at)
                          : "Not available"
                      }
                    />
                    <InfoField
                      label="Last Updated"
                      value={
                        profileData.updated_at
                          ? formatDate(profileData.updated_at)
                          : "Not available"
                      }
                    />
                  </div>
                </div>

                {/* Officer Information */}
                <ProfileRolesCard data={profileData} />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}