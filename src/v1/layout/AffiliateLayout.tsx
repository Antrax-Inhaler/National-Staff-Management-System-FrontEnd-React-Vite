import { useQuery } from "@tanstack/react-query";
import { Building, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { affiliate } from "../api/affiliate";
import Tabs from "./Tabs";

export default function AffiliateLayout() {
  const { uid } = useParams<{ uid: string }>();
  const [showFullText, setShowFullText] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [`affiliate-info-${uid}`],
    queryFn: () => affiliate.info(uid),
    enabled: !!uid,
    staleTime: Infinity,
  });

  useEffect(() => {
    // Reset animation when affiliate changes
    setShowFullText(true);
    setAnimationComplete(false);

    // Start animation sequence
    const timer = setTimeout(() => {
      setShowFullText(false);
      const completeTimer = setTimeout(() => {
        setAnimationComplete(true);
      }, 500); // Time for slide animation to complete

      return () => clearTimeout(completeTimer);
    }, 2000); // Show full text for 2 seconds before sliding

    return () => clearTimeout(timer);
  }, [uid]);

  if (!uid || isError) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-4 text-gray-500">
        <p className="text-lg">Affiliate not found.</p>
        <Link
          to="/affiliates"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <ChevronLeft size={16} />
          Back to Affiliates
        </Link>
      </div>
    );
  }

  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center flex-1 h-screen">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { label: "Members", to: `/affiliates/${uid}/members` },
    { label: "Officers", to: `/affiliates/${uid}/officers` },
    { label: "Configurations", to: `/affiliates/${uid}/configurations` },
  ];

  return (
    <div className="flex flex-col flex-1 bg-white rounded-md shadow shadow-neutral-50">
      {/* Clean Header Design */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        {/* Removed the back button from header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {/* Optional: Add timestamp or other info here */}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 text-white bg-blue-600 rounded-lg">
              <Building size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600">
                  Affiliate Organization
                </span>
                {data?.ORG_region && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">
                      Region: {data.ORG_region}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs
        tabs={tabs}
        showBackButton={true}
        backButtonProps={{ showFullText, animationComplete }}
      />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Outlet context={{ region: data?.ORG_region }} />
      </main>
    </div>
  );
}
