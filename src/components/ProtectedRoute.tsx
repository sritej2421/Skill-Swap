import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showProfileLockModal, setShowProfileLockModal] = useState(false);
  
  // State to force re-evaluation
  const [profileStatusChecked, setProfileStatusChecked] = useState(false);

  // Read profile completion and required fields from localStorage
  const profileCompletion = Number(localStorage.getItem("profileCompletion") || 0);
  let profileRequired = { role: false, skillsTeach: false, skillsLearn: false };
  try {
    profileRequired = JSON.parse(localStorage.getItem("profileRequiredFields") || "{}");
  } catch {}

  const isProfileLocked =
    profileCompletion < 80 ||
    !profileRequired.role ||
    !profileRequired.skillsTeach ||
    !profileRequired.skillsLearn;

  // Only lock for restricted routes
  const restrictedRoutes = ["/matches", "/schedule", "/test"];
  const isRestricted = restrictedRoutes.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    // Check profile status on mount and when user or location changes
    if (user) {
        // Re-read localStorage here to ensure latest state is considered
        const latestCompletion = Number(localStorage.getItem("profileCompletion") || 0);
        let latestRequired = { role: false, skillsTeach: false, skillsLearn: false };
        try {
            latestRequired = JSON.parse(localStorage.getItem("profileRequiredFields") || "{}");
        } catch {}

        const isCurrentlyLocked = latestCompletion < 80 || !latestRequired.role || !latestRequired.skillsTeach || !latestRequired.skillsLearn;

        if (isRestricted && isCurrentlyLocked) {
            setShowProfileLockModal(true);
        }
        // Mark status as checked after initial load
        setProfileStatusChecked(true);
    }

  }, [user, location.pathname, isRestricted]); // Depend on user and location

  // If loading or profile status hasn't been checked yet, show loading
  if (isLoading || !profileStatusChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to so we can send them there after logging in
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (isRestricted && isProfileLocked && showProfileLockModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-all">
        <div className="relative w-full max-w-md mx-4 animate-fade-in">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            {/* SVG illustration (friendly chat/learning theme) */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="40" fill="url(#grad)" />
              <g>
                <rect x="22" y="38" width="36" height="18" rx="9" fill="#fff" fillOpacity=".8" />
                <circle cx="32" cy="47" r="4" fill="#a78bfa" />
                <circle cx="48" cy="47" r="4" fill="#a78bfa" />
                <rect x="36" y="44" width="8" height="2" rx="1" fill="#a78bfa" />
              </g>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a21caf" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="bg-white/80 dark:bg-[#232136]/80 rounded-2xl shadow-2xl border border-indigo-200 dark:border-indigo-700 px-8 pt-20 pb-8 flex flex-col items-center backdrop-blur-xl">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 text-2xl font-bold focus:outline-none"
              onClick={() => (window.location.href = '/')}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Complete your profile to unlock this feature!
            </h2>
            <p className="text-base text-gray-700 dark:text-indigo-200 mb-6 text-center">
              You need to finish your SkillSwap profile before you can access Matches, Schedule, or Take Test.<br/>
              <span className="text-indigo-500 font-medium">It only takes a minute!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                className="flex-1 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all text-lg"
                onClick={() => (window.location.href = '/profile')}
              >
                Go to Profile
              </button>
            </div>
          </div>
        </div>
        <style>{`
          .animate-fade-in {
            animation: fadeInModal 0.4s cubic-bezier(.4,0,.2,1);
          }
          @keyframes fadeInModal {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};
