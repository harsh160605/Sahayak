import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginAsDemoUser: (role: UserRole) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
}

// Initial preloaded realistic college profiles for immediate testing & prototype presentation
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
    const saved = localStorage.getItem('smartattend_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_TEACHER;
      }
    }
    return DEMO_TEACHER; // Default to Dr. Alok Sharma on first visit for effortless evaluation
  });
  
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartattend_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smartattend_current_user');
    }
  }, [currentUser]);

  const loginAsDemoUser = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentUser(role === 'teacher' ? DEMO_TEACHER : DEMO_STUDENT);
      setLoading(false);
    }, 200);
  };

  const switchUserRole = (role: UserRole) => {
    setCurrentUser(role === 'teacher' ? DEMO_TEACHER : DEMO_STUDENT);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
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

