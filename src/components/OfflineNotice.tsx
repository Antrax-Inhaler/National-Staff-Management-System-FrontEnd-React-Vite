import { useEffect, useState } from "react";

export default function OfflineNotice() {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [visible, setVisible] = useState<boolean>(!online);

  useEffect(() => {
    function handleOffline() {
      setOnline(false);
      setVisible(true);
    }
    function handleOnline() {
      setOnline(true);
      // keep visible briefly so user sees "back online"
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(t);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // cleanup
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // if visible false => render nothing
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out
        ${online ? "opacity-100 translate-y-0" : "opacity-100 translate-y-0" }`}
    >
      <div
        className={`
          flex items-center space-x-3 px-4 py-2 rounded-md
          shadow-sm border
          ${online ? "bg-white/90 border-green-200 text-green-800" : "bg-yellow-50 border-yellow-200 text-yellow-900"}
          backdrop-blur-sm
        `}
        style={{ minWidth: 260 }}
      >
        {/* small dot */}
        <span
          className={`w-2 h-2 rounded-full ${online ? "bg-green-600" : "bg-yellow-600"}`}
          aria-hidden="true"
        />
        <div className="text-sm">
          {online ? <strong>Back online</strong> : <strong>No internet connection</strong>}
          <div className="text-xs text-gray-500">{online ? "Connection restored" : "Some features may not work"}</div>
        </div>
      </div>
    </div>
  );
}
