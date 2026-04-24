import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup,
  verifyBeforeUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile,
  deleteUser,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: check if user signed in with Google
  const isGoogleUser = () => {
    return currentUser?.providerData?.some(p => p.providerId === 'google.com') || false;
  };

  // Helper: check if user has email/password provider
  const hasPasswordProvider = () => {
    return currentUser?.providerData?.some(p => p.providerId === 'password') || false;
  };

  // Sign up and create user document
  const register = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      currentStreak: 0,
      onboardingComplete: false,
      createdAt: serverTimestamp()
    });
    
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  // Helper: detect mobile web browser (not native Capacitor)
  const isMobileWeb = () => {
    if (Capacitor.isNativePlatform()) return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  };

  // Sign in with Google — popup shows native account picker on Android
  const loginWithGoogle = async () => {
    let result, user;

    if (Capacitor.isNativePlatform()) {
      // Use native Capacitor plugin for Android/iOS
      const nativeResult = await FirebaseAuthentication.signInWithGoogle();
      const idToken = nativeResult.credential?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token returned.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      result = await signInWithCredential(auth, credential);
      user = result.user;
    } else if (isMobileWeb()) {
      // Mobile web: use redirect (popups are blocked on mobile browsers)
      await signInWithRedirect(auth, googleProvider);
      return; // Page will reload; redirect result handled in useEffect
    } else {
      // Desktop web: use popup
      result = await signInWithPopup(auth, googleProvider);
      user = result.user;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        photoURL: user.photoURL || '',
        googlePhotoURL: user.photoURL || '',
        currentStreak: 0,
        onboardingComplete: false,
        createdAt: serverTimestamp()
      });
    } else {
      if (user.photoURL) {
        await updateDoc(doc(db, 'users', user.uid), { googlePhotoURL: user.photoURL });
      }
    }
    return result;
  };

  // Link existing email/password account with Google
  const linkGoogleAccount = async () => {
    const result = await linkWithPopup(auth.currentUser, googleProvider);
    const user = result.user;
    const updates = {};
    if (user.photoURL) updates.photoURL = user.photoURL;
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (!updates.firstName) updates.firstName = parts[0] || '';
      if (!updates.lastName) updates.lastName = parts.slice(1).join(' ') || '';
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'users', user.uid), updates);
    }
    return result;
  };

  // Fetch user document from Firestore
  const getUserData = async (uid) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  };

  // Update Firestore user profile fields
  const updateUserProfile = async (uid, data) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  };

  // Update Firebase Auth email (sends verification to new email first)
  const updateUserEmail = async (newEmail) => {
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  };

  // Update Firebase Auth password
  const updateUserPassword = async (newPassword) => {
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  // Update Firebase Auth display name
  const updateDisplayName = async (displayName) => {
    await firebaseUpdateProfile(auth.currentUser, { displayName });
  };

  // Permanently delete account and Firestore data
  const deleteAccount = async () => {
    const uid = auth.currentUser.uid;
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(auth.currentUser);
  };

  useEffect(() => {
    let unsubscribeUser = () => {};

    // Check for standard redirect result from Google Login
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              photoURL: user.photoURL || '',
              googlePhotoURL: user.photoURL || '',
              currentStreak: 0,
              onboardingComplete: false,
              createdAt: serverTimestamp()
            });
          } else {
            if (user.photoURL) {
              await updateDoc(doc(db, 'users', user.uid), { googlePhotoURL: user.photoURL });
            }
          }
        }
      } catch (error) {
        console.error("Error handling Google redirect result:", error);
      }
    };
    handleRedirectResult();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docS) => {
          if (docS.exists()) {
            setUserData({ ...docS.data(), id: docS.id });
          } else {
            setUserData(null);
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    userData,
    register,
    login,
    loginWithGoogle,
    linkGoogleAccount,
    logout,
    getUserData,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    updateDisplayName,
    deleteAccount,
    isGoogleUser,
    hasPasswordProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center bg-slate-100 min-h-screen">
          <div className="w-full max-w-[480px] bg-liftly-navy min-h-screen flex flex-col items-center justify-center shadow-2xl">
            <div className="animate-pulse flex flex-col items-center">
              <img src="/favicon.png" alt="Liftly" className="w-16 h-16 mb-4 opacity-80" />
              <div className="w-8 h-1 bg-liftly-teal/50 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
