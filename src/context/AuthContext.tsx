import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, isLiveFirebaseConfigured } from '../config/firebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isLiveFirebase: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (
    email: string, 
    pass: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
}

export const DEMO_TEACHER: UserProfile = {
  uid: 'teacher_prof_sharma',
  fullName: 'Dr. Alok Sharma',
  email: 'alok.sharma@college.edu',
  role: 'teacher',
  facultyId: 'FAC-CS-104',
  department: 'Computer Science & Engineering',
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z'
};

export const DEMO_STUDENT: UserProfile = {
  uid: 'student_aarav_patel',
  fullName: 'Aarav Patel',
  email: 'aarav.cs22@college.edu',
  role: 'student',
  studentId: '22CS042',
  department: 'Computer Science & Engineering',
  semester: '6th Semester',
  academicYear: '2024-2025',
  createdAt: '2024-01-15T11:30:00Z',
  updatedAt: '2024-01-15T11:30:00Z'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // If live Firebase is configured, start clean or wait for onAuthStateChanged
    if (isLiveFirebaseConfigured) {
      const saved = localStorage.getItem('smartattend_current_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only use if not a demo fallback UID
          if (!parsed.uid.startsWith('teacher_prof_') && !parsed.uid.startsWith('student_aarav_')) {
            return parsed;
          }
        } catch {
          return null;
        }
      }
      return null;
    }
    // Default demo prototype fallback
    return DEMO_TEACHER;
  });

  const [loading, setLoading] = useState<boolean>(isLiveFirebaseConfigured);

  // Sync with actual Firebase Auth state
  useEffect(() => {
    if (!isLiveFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setCurrentUser(profile);
            localStorage.setItem('smartattend_current_user', JSON.stringify(profile));
          } else {
            console.warn('Firebase user exists but no Firestore profile found.');
          }
        } catch (e) {
          console.error('Failed to fetch Firestore user profile:', e);
        }
      } else {
        // User logged out from Firebase
        const saved = localStorage.getItem('smartattend_current_user');
        if (saved && !saved.includes('teacher_prof_') && !saved.includes('student_aarav_')) {
          setCurrentUser(null);
          localStorage.removeItem('smartattend_current_user');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isLiveFirebaseConfigured) {
      return { success: false, error: 'Live Firebase is not configured. Use demo login or enter .env keys.' };
    }
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setCurrentUser(profile);
        localStorage.setItem('smartattend_current_user', JSON.stringify(profile));
        return { success: true };
      }
      return { success: false, error: 'User authenticated, but no profile document found in Firestore.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (
    email: string, 
    pass: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!isLiveFirebaseConfigured) {
      return { success: false, error: 'Live Firebase is not configured.' };
    }
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        ...profileData,
        uid: cred.user.uid,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setCurrentUser(newProfile);
      localStorage.setItem('smartattend_current_user', JSON.stringify(newProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset.' };
    }
  };

  const loginAsDemoUser = (role: UserRole) => {
    const user = role === 'teacher' ? DEMO_TEACHER : DEMO_STUDENT;
    setCurrentUser(user);
    localStorage.setItem('smartattend_current_user', JSON.stringify(user));
  };

  const switchUserRole = (role: UserRole) => {
    loginAsDemoUser(role);
  };

  const logout = async () => {
    if (isLiveFirebaseConfigured && auth.currentUser) {
      await signOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('smartattend_current_user');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
    localStorage.setItem('smartattend_current_user', JSON.stringify(updated));

    if (isLiveFirebaseConfigured && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), updates);
      } catch (e) {
        console.error('Failed to sync profile update to Firestore:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isLiveFirebase: isLiveFirebaseConfigured,
        loginWithEmail,
        registerUser,
        resetPassword,
        loginAsDemoUser,
        logout,
        updateProfile,
        switchUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
