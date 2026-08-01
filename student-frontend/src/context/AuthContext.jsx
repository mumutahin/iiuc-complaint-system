import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  sendPasswordResetEmail,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/firebaseConfig.js';
import { api } from '../services/api.js';
import { mapFirebaseError } from '../../../shared/constants.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Firebase user
  const [profile, setProfile] = useState(null); // MongoDB user document
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

  async function register({ name, email, password }) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(credential.user, { displayName: name });
      await syncProfile();
      return credential.user;
    } catch (err) {
      throw new Error(mapFirebaseError(err.code));
    }
  }

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

      // Firebase auto-creates a new account on the FIRST Google sign-in
      // for any identity it's never seen. getAdditionalUserInfo tells us
      // whether THIS sign-in was the one that just created it — if so,
      // this Google account was never registered, so we undo the
      // auto-creation and refuse entry rather than silently letting
      // anyone with a Google account in.
      const { isNewUser } = getAdditionalUserInfo(credential) || {};
      if (isNewUser) {
        try {
          await deleteUser(credential.user);
        } catch {
          await signOut(auth); // best-effort fallback if delete fails for any reason
        }
        throw new Error(
          'This Google account is not registered. Please create an account first, or ask an administrator.'
        );
      }

      return credential.user;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return null; // user just closed it, not a real error
      if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account with this email already exists. Please sign in with your email and password instead.');
      }
      if (err.code) throw new Error(mapFirebaseError(err.code));
      throw err; // our own thrown "not registered" Error — pass it through as-is
    }
  }

  async function logout() {
    await signOut(auth);
  }

  /**
   * Always resolves the same way regardless of whether the email is
   * actually registered — this is deliberate, not an oversight. Some
   * Firebase projects have "email enumeration protection" on (in which
   * case Firebase itself never reveals this either), but even if it's
   * off, we don't want our own UI to become a way to check which emails
   * have accounts. Only genuinely actionable errors (bad email format,
   * rate limiting) are surfaced distinctly.
   */
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      if (err.code === 'auth/invalid-email') throw new Error(mapFirebaseError(err.code));
      if (err.code === 'auth/too-many-requests') throw new Error(mapFirebaseError(err.code));
      if (err.code === 'auth/user-not-found') return; // swallow — see note above
      throw new Error(mapFirebaseError(err.code));
    }
  }

  /**
   * Deletes the backend account (MongoDB user + Firebase Auth record;
   * complaints are deliberately preserved — see authController.js),
   * then ends the local session. The backend deletion is authoritative;
   * signOut here just makes sure the browser doesn't keep acting as if
   * the now-deleted account is still logged in.
   */
  async function deleteAccount() {
    await api.delete('/auth/me');
    await signOut(auth);
  }

  const value = {
    currentUser,
    profile,
    loading,
    isAuthenticated: Boolean(currentUser),
    role: profile?.role || null,
    register,
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
