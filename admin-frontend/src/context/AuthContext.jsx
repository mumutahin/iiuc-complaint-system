import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
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

      // Same rule as the student app: Firebase auto-creates an account
      // on the first-ever Google sign-in for an identity. On the STAFF
      // portal this matters even more — staff accounts are provisioned
      // by a superadmin, never self-service-created via a Google popup.
      const { isNewUser } = getAdditionalUserInfo(credential) || {};
      if (isNewUser) {
        try {
          await deleteUser(credential.user);
        } catch {
          await signOut(auth);
        }
        throw new Error(
          'This Google account is not registered as staff. Ask a superadmin to create your account first.'
        );
      }

      return credential.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null;
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account with this email already exists. Please sign in with your email and password instead.');
      }
      if (err.code) throw new Error(mapFirebaseError(err.code));
      throw err;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  /** See student-frontend's AuthContext for why this always resolves the same way regardless of whether the email is registered. */
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      if (err.code === 'auth/invalid-email') throw new Error(mapFirebaseError(err.code));
      if (err.code === 'auth/too-many-requests') throw new Error(mapFirebaseError(err.code));
      if (err.code === 'auth/user-not-found') return;
      throw new Error(mapFirebaseError(err.code));
    }
  }

  /** Deletes the backend account (complaints/history are preserved) then ends the local session. */
  async function deleteAccount() {
    await api.delete('/auth/me');
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
    deleteAccount,
    resetPassword,
    refreshProfile: syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
