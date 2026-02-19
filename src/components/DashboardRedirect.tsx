import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Info, Check } from 'lucide-react';

export default function DashboardRedirect() {
  const navigate = useNavigate();
  const { user, userType, loading, hasRoles } = useAuth();
  const [showVerifyingTooltip, setShowVerifyingTooltip] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Sequential status messages
  useEffect(() => {
    if (!redirecting) {
      const messages = [
        "Checking user permissions...",
        "Determining access level...",
        "Verifying dashboard access...",
        "Preparing dashboard..."
      ];
      
      let messageIndex = 0;
      
      const showNextMessage = () => {
        if (messageIndex < messages.length) {
          setCurrentMessage(messages[messageIndex]);
          messageIndex++;
          
          // Schedule next message
          setTimeout(showNextMessage, 800);
        }
      };
      
      // Start showing messages
      showNextMessage();
      
      return () => {
        // Cleanup
      };
    }
  }, [redirecting]);

  useEffect(() => {
    if (loading) return;

    coOrganizationle.log('DashboardRedirect - UserType:', userType);
    coOrganizationle.log('DashboardRedirect - HasRoles:', hasRoles);

    // If user doesn't have roles yet, show loading or fetch roles
    if (!hasRoles) {
      coOrganizationle.log('User roles not loaded yet, waiting...');
      return;
    }

    // DEVELOPMENT MODE: If userType is still null, use roles to determine
    let finalUserType = userType;
    if (!finalUserType && user?.user_metadata?.roles) {
      const roles = user.user_metadata.roles;
      const affiliateId = user.user_metadata.affiliate_id;
      
      const nationalRoles = ['National Administrator', 'Organization Executive Committee', 'Organization Research Committee'];
      const officerRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Grievance Chair', 'Bargaining Chair'];

      if (roles.some((role: string) => nationalRoles.includes(role))) {
        finalUserType = 'national';
      } else if (roles.some((role: string) => officerRoles.includes(role))) {
        finalUserType = 'affiliate';
      } else if (affiliateId) {
        finalUserType = 'member';
      }
      
      coOrganizationle.log('Calculated UserType from metadata:', finalUserType);
    }

    // Redirect based on user type
    if (finalUserType === 'national') {
      coOrganizationle.log('Redirecting to national dashboard');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/national/dashboard', { replace: true });
      }, 1000);
    } else if (finalUserType === 'affiliate') {
      coOrganizationle.log('Redirecting to affiliate dashboard');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/affiliate/dashboard', { replace: true });
      }, 1000);
    } else if (finalUserType === 'member') {
      coOrganizationle.log('Redirecting to member dashboard');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/member/dashboard', { replace: true });
      }, 1000);
    } else {
      coOrganizationle.log('No valid user type, redirecting to unauthorized');
      setRedirecting(true);
      setTimeout(() => {
        navigate('/unauthorized', { replace: true });
      }, 1000);
    }
  }, [user, userType, loading, hasRoles, navigate]);

  if (loading || !hasRoles || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-white">
        <div className="text-center">
          {/* Animated Organization Logo */}
          <div className="relative mx-auto w-32 h-32 mb-6">
            {/* Outer pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-75"></div>
            
            {/* Middle pulse ring */}
            <div className="absolute inset-4 animate-pulse rounded-full bg-blue-100 opacity-50"></div>
            
            {/* Logo container with spin */}
            <div className="absolute inset-6 flex items-center justify-center">
              <div className="relative">
                {/* Organization Logo */}
                <img 
                  src="https://organization.org/wp-content/uploads/Organization-logo-round_500-400x400.png" 
                  alt="Organization Logo"
                  className="relative w-20 h-20 animate-pulse"
                  style={{ animationDuration: '2s' }}
                  onMouseEnter={() => setShowVerifyingTooltip(true)}
                  onMouseLeave={() => setShowVerifyingTooltip(false)}
                />
                
                {/* Tooltip on hover */}
                {showVerifyingTooltip && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Info size={12} />
                      <span>Determining dashboard access...</span>
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading text with progress indicators */}
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-700">
              {redirecting ? "Redirecting to Dashboard" : "Preparing Your Dashboard"}
            </p>
            
            {/* Animated progress dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            {/* Single status message */}
            <div className="max-w-md mx-auto h-20">
              {currentMessage && !redirecting && (
                <div 
                  className="flex items-center justify-between text-sm text-gray-600"
                  style={{
                    animation: 'fadeIn 0.5s ease-out forwards',
                    opacity: 0,
                    transform: 'translateY(5px)'
                  }}
                >
                  <span>{currentMessage}</span>
                  <Check 
                    className="w-4 h-4 text-green-500" 
                    style={{
                      animation: 'checkMark 0.5s ease-out forwards',
                      transform: 'scale(0)',
                      opacity: 0
                    }}
                  />
                </div>
              )}
              
              {redirecting && (
                <div 
                  className="flex items-center justify-center text-sm text-blue-600"
                  style={{
                    animation: 'fadeIn 0.5s ease-out forwards',
                    opacity: 0,
                    transform: 'translateY(5px)'
                  }}
                >
                  <span>Finalizing redirect... Please wait</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Add animations via style tag */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes checkMark {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return null;
}