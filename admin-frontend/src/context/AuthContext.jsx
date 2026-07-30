import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig.js';
import { api } from '../services/api.js';
import { mapFirebaseError } from '../../../shared/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async () => {
    const { data } = await api.post('/auth/me');
    setProfile(data.data);
    return data.data;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncProfile();
        } catch (err) {
          console.error('Failed to sync profile:', err.message);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [syncProfile]);

  async function login({ email, password }) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return credential.user;
    } catch (err) {
      throw new Error(mapFirebaseError(err.code));
    }
  }

  async function loginWithGoogle() {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null;
      throw new Error(mapFirebaseError(err.code));
    }
  }

  async function logout() {
    await signOut(auth);
  }

  const role = profile?.role || null;

  const value = {
    currentUser,
    profile,
    loading,
    isAuthenticated: Boolean(currentUser),
    role,
    isStaff: role === 'admin' || role === 'superadmin',
    isSuperadmin: role === 'superadmin',
    login,
    loginWithGoogle,
    logout,
    refreshProfile: syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
