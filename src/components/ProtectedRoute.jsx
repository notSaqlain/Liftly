import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // While Firestore userData is still loading for this user, render nothing.
  // This prevents new Google users from briefly seeing the app before being
  // redirected to onboarding once their document resolves.
  if (currentUser && userData === null && location.pathname !== '/onboarding') {
    return null;
  }

  // Intercept users who haven't completed onboarding (covers both email & Google new users)
  if (userData && userData.onboardingComplete === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent users who HAVE completed onboarding from returning to onboarding
  if (userData && userData.onboardingComplete === true && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
