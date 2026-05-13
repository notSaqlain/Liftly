import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Root paths where pressing back should minimize the app instead of going back
const ROOT_PATHS = ['/', '/login', '/register', '/onboarding'];

/**
 * Intercepts the Android hardware back button.
 * - On root pages (dashboard, login, etc.): minimizes the app to background.
 * - On any other page: navigates back in history.
 * Does nothing on web (only active on native platform).
 */
export const useHardwareBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handler = App.addListener('backButton', ({ canGoBack }) => {
      const isRoot = ROOT_PATHS.includes(location.pathname);

      if (isRoot) {
        // Minimize app instead of closing it
        App.minimizeApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        // Fallback: go to dashboard
        navigate('/');
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, [location.pathname, navigate]);
};
