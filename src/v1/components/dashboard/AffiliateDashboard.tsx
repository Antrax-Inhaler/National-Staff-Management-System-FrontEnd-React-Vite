import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Phone,
  Mail,
  UserCheck,
  Building,
  Shield,
  CreditCard,
  MapPin,
  Grid,
  List,
} from "lucide-react";
import { dashboard } from "../../api/dashboard";
import MetricSkeleton from "../../components/ui/skeletons/MetricSkeleton";
import ListSkeleton from "../../components/ui/skeletons/ListSkeleton";
import { useAuth } from "../../contexts/AuthContext";
import ClickableAvatar from "../../../components/ui/ClickableAvatar";
import TechSupportInfo from "../TechSupportCard";
import BugReportCard from "@v1/components/dashboard/components/BugReportCard";

interface Officer {
  position: string;
  member_name: string;
  mobile_phone?: string;
  work_email?: string;
  home_email?: string;
  work_phone?: string;
  profile_photo_url?: string;
  member_id?: string;
  official_email?: string;
  is_national_officer?: boolean;
  real_email?: string;
}

interface DashboardData {
  affiliate_officers: Officer[];
  national_officers: Officer[];
  affiliate_name: string;
  total_officers: number;
  total_national_officers: number;
}

export default function AffiliateDashboard() {
  const { userRole } = useAuth();
  const [viewType, setViewType] = useState<"cards" | "table">("cards");
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const {
    data: dashboardData,
    error,
    isLoading: loading,
    refetch,
  } = useQuery<DashboardData | null>({
    queryKey: ["dashboard"],
    queryFn: () => dashboard.affiliate(),
    staleTime: 5 * 60 * 1000,
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneForLink = (phone: string) => {
    return phone.replace(/[^\d+]/g, "");
  };

  const getDisplayEmail = (officer: Officer) => {
    return officer.official_email || officer.work_email;
  };

  const getRealEmail = (officer: Officer) => {
    return officer.real_email || officer.work_email || officer.official_email;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md text-center">
          <div className="p-6 text-red-700 rounded-lg bg-red-50">
            <p className="font-semibold">Error Loading Dashboard</p>
            <p className="mt-2 text-sm">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 mt-4 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  `${dashboardData?.affiliate_name || "NSO"} Dashboard`
                )}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Contact directories and organizational information
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewType("cards")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewType === "cards"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid size={16} />
                  Cards
                </button>
                <button
                  onClick={() => setViewType("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewType === "table"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List size={16} />
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          {loading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : dashboardData ? (
            <>
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="w-6 h-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Affiliate Officers</p>
                    <p className="text-xl font-semibold">
                      {dashboardData.total_officers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">National Officers</p>
                    <p className="text-xl font-semibold">
                      {dashboardData.total_national_officers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <Building className="w-6 h-6 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Regional Director</p>
                    <p className="text-sm font-semibold text-gray-400">
                      Coming Soon
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Dues Support</p>
                    <a
                      href="mailto:dues@organization.org"
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      dues@organization.org
                    </a>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Affiliate Officers Directory */}
          <div className="bg-white rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Active Affiliate Officers
                </h2>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                {dashboardData?.total_officers || 0}
              </span>
            </div>

            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-6">
                  <ListSkeleton items={5} />
                </div>
              ) : dashboardData?.affiliate_officers &&
                dashboardData.affiliate_officers.length > 0 ? (
                <div className="p-6 space-y-4">
                  {viewType === "cards" ? (
                    // Card View
                    dashboardData.affiliate_officers.map((officer, index) => (
                      <OfficerCard
                        key={`${officer.member_id}-${officer.position}-${index}`}
                        officer={officer}
                        getUserInitials={getUserInitials}
                        formatPhoneForLink={formatPhoneForLink}
                        onImageClick={setSelectedImage}
                        getDisplayEmail={getDisplayEmail}
                        getRealEmail={getRealEmail}
                      />
                    ))
                  ) : (
                    // Table View
                    <OfficerTable
                      officers={dashboardData.affiliate_officers}
                      getUserInitials={getUserInitials}
                      formatPhoneForLink={formatPhoneForLink}
                      onImageClick={setSelectedImage}
                      getDisplayEmail={getDisplayEmail}
                      getRealEmail={getRealEmail}
                    />
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active affiliate officers found</p>
                </div>
              )}
            </div>
          </div>

          {/* National Officers Directory */}
          <div className="bg-white rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Active National Officers
                </h2>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                {dashboardData?.total_national_officers || 0}
              </span>
            </div>

            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-6">
                  <ListSkeleton items={5} />
                </div>
              ) : dashboardData?.national_officers &&
                dashboardData.national_officers.length > 0 ? (
                <div className="p-6 space-y-4">
                  {viewType === "cards" ? (
                    // Card View
                    dashboardData.national_officers.map((officer, index) => (
                      <OfficerCard
                        key={`${officer.member_id}-${officer.position}-${index}`}
                        officer={officer}
                        getUserInitials={getUserInitials}
                        formatPhoneForLink={formatPhoneForLink}
                        onImageClick={setSelectedImage}
                        getDisplayEmail={getDisplayEmail}
                        getRealEmail={getRealEmail}
                      />
                    ))
                  ) : (
                    // Table View
                    <OfficerTable
                      officers={dashboardData.national_officers}
                      getUserInitials={getUserInitials}
                      formatPhoneForLink={formatPhoneForLink}
                      onImageClick={setSelectedImage}
                      getDisplayEmail={getDisplayEmail}
                      getRealEmail={getRealEmail}
                    />
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active national officers found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
          {/* Regional Director Information */}
          <div className="p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Information for ORG Regional Director
              </h2>
            </div>
            <div className="p-4 text-center border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  Regional Director Contact
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Regional director contact details will be available soon.
              </p>
              <div className="p-3 mt-3 border border-yellow-200 rounded bg-yellow-50">
                <p className="text-xs text-yellow-800">
                  This feature is currently being developed and will be
                  available in a future update.
                </p>
              </div>
            </div>
          </div>

          {/* Dues Support Information */}
          <div className="p-6 bg-white rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Contact Information for Dues Related Questions
              </h2>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium text-gray-600">
                    For all dues-related questions:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <a
                      href="mailto:dues@organization.org"
                      className="text-lg font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      dues@organization.org
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-center text-gray-500">
                    Please include your full name and member ID in all
                    communications for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Information - Always Last on the grid, add above for new cards */}
          <TechSupportInfo />
          <BugReportCard />
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative max-w-4xl max-h-full p-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute p-2 text-white bg-black bg-opacity-50 rounded-full top-4 right-4 hover:bg-opacity-75"
              >
                <svg
                  className="w-6 h-6"
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
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Officer Card Component
function OfficerCard({
  officer,
  getUserInitials,
  formatPhoneForLink,
  onImageClick,
  getDisplayEmail,
  getRealEmail,
}: {
  officer: Officer;
  getUserInitials: (name: string) => string;
  formatPhoneForLink: (phone: string) => string;
  onImageClick: (image: { url: string; alt: string }) => void;
  getDisplayEmail: (officer: Officer) => string | undefined;
  getRealEmail: (officer: Officer) => string | undefined;
}) {
  const primaryPhone = officer.mobile_phone || officer.work_phone;
  const displayEmail = getDisplayEmail(officer);
  const realEmail = getRealEmail(officer);

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex items-start gap-3">
        {/* Profile Photo */}
        <div className="flex-shrink-0">
          <ClickableAvatar
            imageUrl={officer.profile_photo_url}
            alt={officer.member_name}
            fallbackText={getUserInitials(officer.member_name)}
            size="md"
            onClick={() => {
              if (officer.profile_photo_url) {
                onImageClick({
                  url: officer.profile_photo_url,
                  alt: officer.member_name,
                });
              }
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-gray-900">{officer.position}</h3>
              <p className="text-sm text-gray-600">{officer.member_name}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {/* Phone Numbers */}
            <div className="flex flex-wrap gap-4">
              {primaryPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <a
                    href={`tel:${formatPhoneForLink(primaryPhone)}`}
                    className="text-gray-600 transition-colors hover:text-blue-600 hover:underline"
                    title={`Call ${primaryPhone}`}
                  >
                    {primaryPhone}
                  </a>
                </div>
              )}

              {/* Email Address - Display overlay email, link to real email */}
              {displayEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <a
                    href={`mailto:${realEmail}`}
                    className="text-gray-600 hover:text-blue-600 hover:underline transition-colors truncate max-w-[200px]"
                    title={`Email ${realEmail}`}
                  >
                    {displayEmail}
                  </a>
                  {displayEmail.includes('@organization.org') && (
                    <span className="px-1 text-xs text-green-600 bg-green-50 rounded">
                      Official
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Officer Table Component
function OfficerTable({
  officers,
  getUserInitials,
  formatPhoneForLink,
  onImageClick,
  getDisplayEmail,
  getRealEmail,
}: {
  officers: Officer[];
  getUserInitials: (name: string) => string;
  formatPhoneForLink: (phone: string) => string;
  onImageClick: (image: { url: string; alt: string }) => void;
  getDisplayEmail: (officer: Officer) => string | undefined;
  getRealEmail: (officer: Officer) => string | undefined;
}) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Officer
            </th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Position
            </th>
            <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Contact
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {officers.map((officer, index) => {
            const primaryPhone = officer.mobile_phone || officer.work_phone;
            const displayEmail = getDisplayEmail(officer);
            const realEmail = getRealEmail(officer);

            return (
              <tr
                key={`${officer.member_id}-${officer.position}-${index}`}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <ClickableAvatar
                      imageUrl={officer.profile_photo_url}
                      alt={officer.member_name}
                      fallbackText={getUserInitials(officer.member_name)}
                      size="sm"
                      onClick={() => {
                        if (officer.profile_photo_url) {
                          onImageClick({
                            url: officer.profile_photo_url,
                            alt: officer.member_name,
                          });
                        }
                      }}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {officer.member_name}
                      </span>
                      {officer.is_national_officer && (
                        <span className="block px-1 mt-1 text-xs font-medium text-green-700 bg-green-100 rounded-full w-fit">
                          National
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {officer.position}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div className="space-y-1">
                    {primaryPhone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <a
                          href={`tel:${formatPhoneForLink(primaryPhone)}`}
                          className="transition-colors hover:text-blue-600 hover:underline"
                          title={`Call ${primaryPhone}`}
                        >
                          {primaryPhone}
                        </a>
                      </div>
                    )}
                    {displayEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <a
                          href={`mailto:${realEmail}`}
                          className="hover:text-blue-600 hover:underline transition-colors truncate max-w-[200px]"
                          title={`Email ${realEmail}`}
                        >
                          {displayEmail}
                        </a>
                        {displayEmail.includes('@organization.org') && (
                          <span className="px-1 text-xs text-green-600 bg-green-50 rounded">
                            Official
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}