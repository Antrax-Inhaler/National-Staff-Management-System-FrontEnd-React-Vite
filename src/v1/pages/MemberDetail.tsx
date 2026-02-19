import { useQuery } from "@tanstack/react-query";
import { members } from "@v1/api/member";
import {
  extractAndFormatDate
} from "@v1/helpers/simpleDateUtils";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Copy,
  Edit2Icon,
  ExternalLink,
  Home,
  Info,
  Mail as MailIcon,
  MapPin,
  MapPin as MapPinIcon,
  Navigation,
  Phone,
  PhoneCall,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Trophy,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // ADD useSearchParams

// Move this inside the v1 folder
import Avatar from "@/components/ui/Avater";

// Define interfaces based on your response structure
interface ContactInfo {
  home_email: string | null;
  work_email: string | null;
  official_email: string | null;
  mobile_phone: string | null;
  work_phone: string | null;
  home_phone: string | null;
}

interface Address {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  state_id: number | null;
  zip_code: string | null;
}

interface Dates {
  date_of_birth: string | null;
  date_of_hire: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  photo_signed_url: string | null;
}

interface Affiliate {
  id: number;
  name: string;
  affiliate_type: string;
  logo_url: string | null;
}

interface UserAccount {
  id: number;
  email: string;
  supabase_uid: string;
  email_verified_at: string | null;
}

interface OfficerPosition {
  id: number;
  position_name: string;
  affiliate_name: string;
  start_date: string;
  is_vacant: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  age: number | null;
  tenure_years: number | null;
  is_active: boolean;
}

interface MemberData {
  id: number;
  member_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  level: string;
  status: string | null;
  employment_status: string | null;
  gender: string | null;
  self_id: string | null;
  non_nso: boolean;
  contact_info: ContactInfo;
  address: Address;
  dates: Dates;
  additional_info: any[];
  profile: Profile;
  affiliate: Affiliate;
  user_account: UserAccount;
  officer_positions: OfficerPosition[];
  national_roles: any[];
  metadata: {
    updated_by: {
      id: number;
      name: string;
      email: string;
    } | null;
  };
  statistics: Statistics;
}

// Add this helper function before the component
const getGoogleMapsUrl = (address: Address) => {
  const parts = [
    address?.address_line1,
    address?.address_line2,
    address?.city,
    address?.state,
    address?.zip_code,
  ].filter((part) => part && part.trim() !== "");

  if (parts.length === 0) return null;

  const query = parts.join(", ").replace(/\s+/g, "+");
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

// Helper functions
const safeToFixed = (value: number | null, decimals: number = 1) => {
  return value !== null ? value.toFixed(decimals) : "N/A";
};

const safeDisplay = (value: any, fallback: string = "Not specified") => {
  return value !== null && value !== undefined && value !== ""
    ? value
    : fallback;
};

// Helper to determine which email to show (prioritize work_email, fallback to home_email)
const getPersonalEmail = (contactInfo: ContactInfo) => {
  return contactInfo.work_email || contactInfo.home_email || null;
};

// Helper to check if a value is clickable (not "Not specified" or similar)
const isClickable = (value: any) => {
  if (!value) return false;
  const stringValue = String(value).toLowerCase();
  const nonClickableValues = [
    "not specified",
    "n/a",
    "none",
    "null",
    "undefined",
    "",
  ];
  return !nonClickableValues.includes(stringValue.trim());
};

// Skeleton Components
function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="w-48 h-4 mb-2 bg-gray-200 rounded"></div>
          <div className="w-32 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="h-32 mb-6 bg-gray-200 rounded-xl"></div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 bg-white rounded-xl">
              <div className="w-40 h-6 mb-4 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-white rounded-xl">
              <div className="w-32 h-6 mb-4 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // ADD this
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Get active tab from URL parameter or default to "overview"
  const urlTab = searchParams.get("tab") as
    | "overview"
    | "positions"
    | "contact"
    | "history";
  const [activeTab, setActiveTab] = useState<
    "overview" | "positions" | "contact" | "history"
  >(urlTab || "overview");

  const [copiedAddress, setCopiedAddress] = useState(false);

  // Use the show function from your API
  const {
    data: memberData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["member", id],
    queryFn: () => members.show(id!),
    enabled: !!id,
  });

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== "overview") {
      searchParams.set("tab", activeTab);
    } else {
      searchParams.delete("tab");
    }
    setSearchParams(searchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Initialize tab from URL on component mount
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["overview", "positions", "contact", "history"].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format phone number
  const formatPhone = (phone: string | null) => {
    if (!phone || phone.trim() === "") return "Not specified";
    const cleaned = phone.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  // Status badge color
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Level badge color
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "executive":
        return "bg-purple-100 text-purple-800";
      case "associate":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Employment status color
  const getEmploymentColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "full time":
        return "bg-emerald-100 text-emerald-800";
      case "part time":
        return "bg-amber-100 text-amber-800";
      case "contract":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle address copy
  const handleCopyAddress = () => {
    if (!memberData) return;

    const fullAddress = [
      memberData.address.address_line1,
      memberData.address.address_line2,
      `${memberData.address.city}, ${memberData.address.state} ${memberData.address.zip_code}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (fullAddress.trim()) {
      navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Handle share functionality - UPDATED to include tab parameter
  const handleShare = () => {
    if (!memberData) return;

    // Create share URL with current tab
    const shareUrl = `${window.location.origin}/members/${id}${activeTab !== "overview" ? `?tab=${activeTab}` : ""}`;

    if (navigator.share) {
      navigator.share({
        title: `${memberData.full_name} - Member Profile`,
        text: `View ${memberData.full_name}'s member profile`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  // Handle tab change with URL update
  const handleTabChange = (
    tab: "overview" | "positions" | "contact" | "history",
  ) => {
    setActiveTab(tab);
  };

  // Check if member data is null or incomplete
  if (error) {
    return (
      <div className="min-h-screen p-4 bg-gray-50 md:p-6">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 group"
          >
            <ArrowLeft
              className="transition-transform group-hover:-translate-x-1"
              size={20}
            />
            <span className="font-medium">Back to Members</span>
          </button>

          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl p-8 border border-gray-200">
            <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Error Loading Member Details
            </h2>
            <p className="max-w-md mb-6 text-center text-gray-600">
              {error.message ||
                "Unable to load member information. Please try again."}
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 font-medium text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 bg-gray-50 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 group"
            >
              <ArrowLeft
                className="transition-transform group-hover:-translate-x-1"
                size={20}
              />
              <span className="font-medium">Back to Members</span>
            </button>
          </div>
          <HeaderSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  // Handle no data state
  if (!memberData) {
    return (
      <div className="min-h-screen p-4 bg-gray-50 md:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 group"
            >
              <ArrowLeft
                className="transition-transform group-hover:-translate-x-1"
                size={20}
              />
              <span className="font-medium">Back to Members</span>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl p-8 border border-gray-200">
            <Info className="w-16 h-16 mb-4 text-gray-400" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              Member Data Not Available
            </h2>
            <p className="max-w-md mb-6 text-center text-gray-600">
              Some required member information is not yet complete or the member
              profile is still being processed.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 font-medium text-white transition-colors bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              Return to Members List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get Google Maps URL (returns null if address is incomplete)
  const googleMapsUrl = getGoogleMapsUrl(memberData.address);

  // Get personal email (prioritize work_email)
  const personalEmail = getPersonalEmail(memberData.contact_info);
  const emailClickable = isClickable(personalEmail);

  // Get phone numbers
  const mobilePhone = memberData.contact_info.mobile_phone;
  const workPhone = memberData.contact_info.work_phone;
  const homePhone = memberData.contact_info.home_phone;
  const mobilePhoneClickable = isClickable(mobilePhone);
  const workPhoneClickable = isClickable(workPhone);
  const homePhoneClickable = isClickable(homePhone);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 mx-auto max-w-7xl md:p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 group"
          >
            <ArrowLeft
              className="transition-transform group-hover:-translate-x-1"
              size={20}
            />
            <span className="font-medium">Back to Members</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="p-6 mb-8 border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4 md:gap-6">
              <Avatar
                imageUrl={memberData.profile.photo_signed_url}
                alt={`${memberData.first_name} ${memberData.last_name}`}
                fallbackText={`${memberData.first_name} ${memberData.last_name}`}
                size="xxxl"
                variant="circle"
              />

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    {memberData.full_name}
                  </h1>
                  {memberData.status && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        memberData.status,
                      )}`}
                    >
                      {memberData.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">
                      Member ID: {memberData.member_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">
                      {memberData?.affiliate?.name ?? "Not assigned"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getLevelColor(
                      memberData.level,
                    )}`}
                  >
                    {memberData.level}
                  </span>
                  {memberData.employment_status && (
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${getEmploymentColor(
                        memberData.employment_status,
                      )}`}
                    >
                      {memberData.employment_status}
                    </span>
                  )}
                  {memberData.non_ORG && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      Non-ORG Member
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-3 text-gray-700 transition-colors bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300"
                title="Share profile"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex p-1 space-x-1 bg-white border border-gray-200 rounded-xl w-fit">
            {[
              { id: "overview", label: "Overview", icon: User },
              { id: "positions", label: "Positions", icon: Briefcase },
              { id: "contact", label: "Contact", icon: PhoneCall },
              { id: "history", label: "History", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main Information */}
              <div className="space-y-6 lg:col-span-2">
                {/* Personal Information */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">
                          Full Name
                        </label>
                        <p className="font-medium text-gray-900">
                          {memberData.full_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Gender</label>
                        <p className="font-medium text-gray-900">
                          {memberData.gender
                            ? memberData.gender.charAt(0).toUpperCase() +
                              memberData.gender.slice(1)
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          Ethnicity
                        </label>
                        <p className="font-medium text-gray-900">
                          {safeDisplay(memberData.self_id)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">
                          Date of Birth
                        </label>
                        <p className="font-medium text-gray-900">
                          {extractAndFormatDate(memberData.dates.date_of_birth)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Age</label>
                        <p className="font-medium text-gray-900">
                          {memberData.statistics.age
                            ? `${memberData.statistics.age} years`
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Tenure</label>
                        <p className="font-medium text-gray-900">
                          {memberData.statistics.tenure_years
                            ? `${memberData.statistics.tenure_years.toFixed(
                                1,
                              )} years`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Employment Details
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-500">
                          Employment Status
                        </p>
                        <p className="font-medium text-gray-900">
                          {safeDisplay(memberData.employment_status)}
                        </p>
                      </div>
                      {memberData.employment_status && (
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getEmploymentColor(
                            memberData.employment_status,
                          )}`}
                        >
                          {memberData.employment_status}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Member Level</p>
                        <p className="font-medium text-gray-900">
                          {memberData.level}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Date of Hire</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(memberData.dates.date_of_hire)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Affiliate Information */}
                {memberData?.affiliate && (
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                    <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      Affiliate Information
                    </h2>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Avatar
                        imageUrl={memberData?.affiliate?.logo_signed_url}
                        alt={"affiliate"}
                        fallbackText={memberData?.affiliate?.name ?? "AF"}
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {memberData.affiliate?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {memberData.affiliate?.affiliate_type} Affiliate
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Account Status */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Account Status
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Member Status</span>
                      {memberData.status ? (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            memberData.status,
                          )}`}
                        >
                          {memberData.status}
                        </span>
                      ) : (
                        <span className="text-gray-500">Not set</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email Verified</span>
                      {memberData.user_account.email_verified_at ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account Active</span>
                      {memberData.statistics.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Recent Activity
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(memberData?.dates?.updated_at)}
                      </p>
                      {memberData?.metadata?.updated_by && (
                        <p className="text-xs text-gray-400">
                          By: {memberData.metadata.updated_by.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(memberData.dates.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    Quick Stats
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                      <span className="font-medium text-blue-700">
                        Officer Positions
                      </span>
                      <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                        {memberData.officer_positions.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                      <span className="font-medium text-green-700">
                        National Roles
                      </span>
                      <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                        {memberData.national_roles.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50">
                      <span className="font-medium text-purple-700">
                        Years of Service
                      </span>
                      <span className="px-3 py-1 text-sm font-medium text-purple-800 bg-purple-100 rounded-full">
                        {safeToFixed(memberData.statistics.tenure_years)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "positions" && (
            <div className="space-y-6">
              {/* Officer Positions */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Officer Positions
                </h2>
                {memberData.officer_positions.length > 0 ? (
                  <div className="space-y-4">
                    {memberData.officer_positions.map(
                      (position: OfficerPosition) => (
                        <div
                          key={position.id}
                          className="p-5 transition-colors border border-gray-200 rounded-xl hover:border-blue-200"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {position.position_name}
                                </h3>
                                {position.is_primary && (
                                  <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                    Primary Role
                                  </span>
                                )}
                                {position.is_vacant ? (
                                  <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                    Vacant
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="mb-3 text-gray-600">
                                {position.affiliate_name}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    Start: {formatDate(position.start_date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                                #{position.id.toString().padStart(3, "0")}
                              </span>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                      No officer positions assigned
                    </p>
                  </div>
                )}
              </div>

              {/* National Roles */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <Shield className="w-5 h-5 text-green-600" />
                  National Roles
                </h2>
                {memberData.national_roles.length > 0 ? (
                  <div className="space-y-4">
                    {memberData.national_roles.map((role: any) => (
                      <div
                        key={role.id}
                        className="p-5 transition-colors border border-gray-200 rounded-xl hover:border-green-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {role.role_name}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                              Assigned on {formatDate(role.created_at)}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No national roles assigned</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <PhoneCall className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h2>
                <div className="space-y-6">
                  {/* Email Address - Single Email Display */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-500">
                      Email Address
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <MailIcon className="w-5 h-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Personal Email
                          </p>
                          {emailClickable ? (
                            <a
                              href={`mailto:${personalEmail}`}
                              className="text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                            >
                            {memberData.contact_info.official_email || memberData.contact_info.work_email}
                            </a>
                          ) : (
                            <p className="text-gray-500">
                              {safeDisplay(personalEmail)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-500">
                      Phone Numbers
                    </h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Smartphone className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">Mobile</p>
                          {mobilePhoneClickable ? (
                            <a
                              href={`tel:${mobilePhone}`}
                              className="text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                            >
                              {formatPhone(mobilePhone)}
                            </a>
                          ) : (
                            <p className="text-gray-500">
                              {formatPhone(mobilePhone)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Work Phone
                          </p>
                          {workPhoneClickable ? (
                            <a
                              href={`tel:${workPhone}`}
                              className="text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                            >
                              {formatPhone(workPhone)}
                            </a>
                          ) : (
                            <p className="text-gray-500">
                              {formatPhone(workPhone)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <Home className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Home Phone
                          </p>
                          {homePhoneClickable ? (
                            <a
                              href={`tel:${homePhone}`}
                              className="text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                            >
                              {formatPhone(homePhone)}
                            </a>
                          ) : (
                            <p className="text-gray-500">
                              {formatPhone(homePhone)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                  Address Information
                </h2>
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="mb-6 space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">
                          Address Line 1
                        </label>
                        <p className="font-medium text-gray-900">
                          {safeDisplay(memberData.address.address_line1)}
                        </p>
                      </div>
                      {memberData.address.address_line2 && (
                        <div>
                          <label className="text-sm text-gray-500">
                            Address Line 2
                          </label>
                          <p className="font-medium text-gray-900">
                            {memberData.address.address_line2}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500">City</label>
                          <p className="font-medium text-gray-900">
                            {safeDisplay(memberData.address.city)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">State</label>
                          <p className="font-medium text-gray-900">
                            {safeDisplay(memberData.address.state)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">
                          ZIP Code
                        </label>
                        <p className="font-medium text-gray-900">
                          {safeDisplay(memberData.address.zip_code)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {googleMapsUrl && (
                        <>
                          <div className="flex gap-3">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center flex-1 gap-2 py-3 font-medium text-gray-700 transition-colors bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                            >
                              <MapPin className="w-5 h-5" />
                              View on Map
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            <button
                              onClick={() => {
                                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  [
                                    memberData.address.address_line1,
                                    memberData.address.city,
                                    memberData.address.state,
                                    memberData.address.zip_code,
                                  ]
                                    .filter(Boolean)
                                    .join(", "),
                                )}`;
                                window.open(directionsUrl, "_blank");
                              }}
                              className="flex items-center justify-center flex-1 gap-2 py-3 font-medium text-gray-700 transition-colors bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                            >
                              <Navigation className="w-5 h-5" />
                              Get Directions
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={handleCopyAddress}
                            className="flex items-center justify-center w-full gap-2 py-3 text-gray-600 transition-colors border border-gray-300 rounded-lg hover:text-gray-900 hover:bg-gray-100"
                          >
                            <Copy className="w-5 h-5" />
                            {copiedAddress ? "Address Copied!" : "Copy Address"}
                          </button>
                        </>
                      )}

                      {!googleMapsUrl && (
                        <div className="py-4 text-center">
                          <p className="text-gray-500">
                            Address information is incomplete
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="p-6 bg-white border border-gray-200 rounded-2xl">
                <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Member Timeline
                </h2>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-8">
                    {/* Created */}
                    <div className="relative flex items-start gap-4">
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Member Created
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                            System Event
                          </span>
                        </div>
                        <p className="mb-2 text-gray-600">
                          Member account was created in the system
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(memberData.dates.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="relative flex items-start gap-4">
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-green-100 rounded-full">
                        <Edit2Icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Profile Updated
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            Administrative
                          </span>
                        </div>
                        <p className="mb-2 text-gray-600">
                          {memberData?.metadata?.updated_by
                            ? `Last updated by ${memberData.metadata?.updated_by.name}`
                            : "Profile was updated"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(memberData?.dates.updated_at)}
                        </p>
                      </div>
                    </div>

                    {/* Hire Date */}
                    {memberData?.dates?.date_of_hire && (
                      <div className="relative flex items-start gap-4">
                        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full">
                          <Briefcase className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              Employment Started
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">
                              Work History
                            </span>
                          </div>
                          <p className="mb-2 text-gray-600">
                            Date of hire at the organization
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(memberData?.dates?.date_of_hire)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
