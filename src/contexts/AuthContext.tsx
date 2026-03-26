import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface UserProfile {
  name: string;
  bloodGroup: string;
  isDonor: boolean;
  location: string;
  reliabilityScore: number;
  donationCount: number;
  receivedCount?: number;
  photoURL?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  lastDonationDate?: string;
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
        profileUnsubscribe = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          async (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              // Profile doc missing — create a minimal one so the dashboard is never blank.
              // This handles accounts registered before Firestore rules were opened.
              const fallback: UserProfile = {
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'BloodBee User',
                bloodGroup: '',
                isDonor: false,
                location: '',
                reliabilityScore: 100,
                donationCount: 0,
                receivedCount: 0,
              };
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  ...fallback,
                  email: firebaseUser.email,
                  registeredAt: serverTimestamp(),
                });
              } catch (_) {
                // Rules still closed — just use fallback locally so UI doesn't block
                setProfile(fallback);
              }
            }
          },
          (err) => {
            console.warn('Firestore profile error — using local fallback', err.code);
            // Still set a minimal profile so PrivateRoute doesn't bounce
            setProfile({
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Hero',
              bloodGroup: '',
              isDonor: false,
              location: '',
              reliabilityScore: 100,
              donationCount: 0,
              receivedCount: 0,
            });
          }
        );
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
