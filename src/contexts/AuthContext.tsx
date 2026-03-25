import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserProfile {
  name: string;
  bloodGroup: string;
  isDonor: boolean;
  location: string;
  reliabilityScore: number;
  donationCount: number;
  photoURL?: string;
  dob?: string;
  gender?: string;
  phone?: string;
}

interface AuthContextType {
  // undefined = still checking, null = logged out, User = logged in
  user: User | null | undefined;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start as undefined — means "we don't know yet"
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      
      if (firebaseUser) {
        // Real-time listener: if the background registration hasn't saved the profile yet,
        // it will wait and auto-update the UI whenever the save finishes!
        try {
          profileUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            }
          }, (err) => {
            console.warn('Profile sync deferred (offline or network issue)', err);
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = undefined;
        }
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Auth state change error:', err);
      setUser(null);
      setLoading(false);
    });

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
      authUnsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  // NEVER block rendering of children — PrivateRoute handles auth gating
  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
