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
  sendPasswordResetEmail,
  deleteUser,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, writeBatch, collection, getDocs } from 'firebase/firestore';
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
      longestStreak: 0,
      lastWorkoutWeek: '',
      totalVolumeLifted: 0,
      totalWorkoutsCompleted: 0,
      best1RM: {},
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
    } else {
      // Web: always use popup (redirect is flaky on mobile web and resets state)
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
        longestStreak: 0,
        lastWorkoutWeek: '',
        totalVolumeLifted: 0,
        totalWorkoutsCompleted: 0,
        best1RM: {},
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

  // Send password reset email (works with Firebase free tier)
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update Firebase Auth display name
  const updateDisplayName = async (displayName) => {
    await firebaseUpdateProfile(auth.currentUser, { displayName });
  };

  // Permanently delete account and ALL associated Firestore data (GDPR)
  const deleteAccount = async () => {
    const uid = auth.currentUser.uid;
    const batch = writeBatch(db);

    // Delete all user_workouts subcollection documents
    try {
      const workoutsSnap = await getDocs(collection(db, 'users', uid, 'user_workouts'));
      workoutsSnap.forEach(d => batch.delete(d.ref));
    } catch (e) {
      console.warn('Could not delete user_workouts:', e);
    }

    // Delete gym presence doc
    batch.delete(doc(db, 'gym_presence', uid));

    // Delete user doc
    batch.delete(doc(db, 'users', uid));

    await batch.commit();
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
              longestStreak: 0,
              lastWorkoutWeek: '',
              totalVolumeLifted: 0,
              totalWorkoutsCompleted: 0,
              best1RM: {},
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
    resetPassword,
    updateDisplayName,
    deleteAccount,
    isGoogleUser,
    hasPasswordProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center min-h-screen" style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002280 100%)' }}>
          <div className="w-full max-w-[480px] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-liftly-teal/15 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative flex flex-col items-center gap-5 z-10">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-liftly-teal/20 blur-xl scale-125" />
                <div className="relative w-20 h-20 rounded-3xl bg-liftly-teal/10 border border-liftly-teal/20 flex items-center justify-center">
                  <img src="/favicon.png" alt="Liftly" className="w-12 h-12 object-contain" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-liftly-teal animate-spin" style={{ animationDuration: '1.2s' }} />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-xl tracking-tight">Liftly</p>
                <p className="text-white/30 text-xs font-semibold mt-1">Loading your profile…</p>
              </div>
            </div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

