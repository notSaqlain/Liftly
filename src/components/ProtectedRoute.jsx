import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Intercept users who haven't completed onboarding
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
