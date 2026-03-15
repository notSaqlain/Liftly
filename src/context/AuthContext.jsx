import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up and create user document
  const register = async (email, password, biometricData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      gender: biometricData.gender,
      age: parseInt(biometricData.age, 10),
      weight: parseFloat(biometricData.weight),
      currentStreak: 0,
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

  // Update Firebase Auth email
  const updateUserEmail = async (newEmail) => {
    await firebaseUpdateEmail(auth.currentUser, newEmail);
    // Sync to Firestore
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { email: newEmail });
  };

  // Update Firebase Auth password
  const updateUserPassword = async (newPassword) => {
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  // Update Firebase Auth display name
  const updateDisplayName = async (displayName) => {
    await firebaseUpdateProfile(auth.currentUser, { displayName });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Safety timeout: if Firebase takes too long, stop blocking the UI
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    getUserData,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    updateDisplayName,
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
