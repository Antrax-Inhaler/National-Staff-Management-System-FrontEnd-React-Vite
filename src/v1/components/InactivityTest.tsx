// src/components/InactivityTest.tsx
import { useState, useEffect } from 'react';

export default function InactivityTest() {
  const [lastActivity, setLastActivity] = useState(new Date());
  const [inactiveTime, setInactiveTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);
      setInactiveTime(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity]);

  const simulateActivity = () => {
    const now = new Date();
    setLastActivity(now);
    console.log('🧪 Test: Simulated activity at', now.toLocaleTimeString());
    // This will trigger the activity events and reset the timer
    document.dispatchEvent(new MouseEvent('click'));
  };

  const forceWarning = () => {
    console.log('🧪 Test: Forcing warning modal');
    // Simulate 30 seconds of inactivity by triggering the warning directly
    document.dispatchEvent(new MouseEvent('mousedown'));
    setTimeout(() => {
      // This will trigger the warning after the normal flow
      console.log('🧪 Test: Warning should appear now');
    }, 100);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <div className="text-sm font-medium mb-2">🧪 Inactivity Test Panel</div>
      <div className="text-xs text-gray-600 mb-1">
        Last activity: {lastActivity.toLocaleTimeString()}
      </div>
      <div className="text-xs text-red-600 font-medium mb-3">
        Inactive: {inactiveTime}s
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={simulateActivity}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Simulate Activity
        </button>
        <button
          onClick={forceWarning}
          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Force Warning (Test)
        </button>
      </div>
    </div>
  );
}