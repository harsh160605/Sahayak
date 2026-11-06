import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Organization } from '../types';
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
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, isLiveFirebaseConfigured } from '../config/firebase';
import { INITIAL_ORGANIZATION } from '../data/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentOrg: Organization | null;
  loading: boolean;
  isLiveFirebase: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (
    email: string, 
    pass: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>,
    orgCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  createOrganizationAndRegisterAdmin: (
    orgName: string,
    orgCode: string,
    city: string,
    adminEmail: string,
    adminPass: string,
    adminName: string,
    department: string,
    facultyId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchUserRole: (role: UserRole) => void;
}

export const DEMO_ADMIN: UserProfile = {
  uid: 'admin_dr_kulkarni',
  fullName: 'Dr. Rajeshwari Kulkarni',
  email: 'dean.apex@college.edu',
  role: 'admin',
  organizationId: 'org_apex_tech',
  organizationCode: 'APEX101',
  organizationName: 'Apex Institute of Technology',
  facultyId: 'DIR-001',
  department: 'Academic Administration',
  createdAt: '2024-01-01T08:00:00Z',
  updatedAt: '2024-01-01T08:00:00Z'
};

export const DEMO_TEACHER: UserProfile = {
  uid: 'teacher_prof_sharma',
  fullName: 'Dr. Alok Sharma',
  email: 'alok.sharma@college.edu',
  role: 'teacher',
  organizationId: 'org_apex_tech',
  organizationCode: 'APEX101',
  organizationName: 'Apex Institute of Technology',
  facultyId: 'FAC-COMP-01',
  department: 'Computer Engineering',
  departmentId: 'dept_comp',
  divisionId: 'div_comp_te_a',
  divisionName: 'Division A',
  isClassTeacher: true,
  isHOD: true,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-10T10:00:00Z'
};

export const DEMO_STUDENT: UserProfile = {
  uid: 'student_aarav_patel',
  fullName: 'Aarav Patel',
  email: 'aarav.cs22@college.edu',
  role: 'student',
  organizationId: 'org_apex_tech',
  organizationCode: 'APEX101',
  organizationName: 'Apex Institute of Technology',
  studentId: '22CS042',
  rollNo: '42',
  department: 'Computer Engineering',
  departmentId: 'dept_comp',
  yearOfStudy: 'Third Year',
  divisionId: 'div_comp_te_a',
  divisionName: 'Division A',
  semester: '6th Semester',
  academicYear: '2026–27',
  createdAt: '2024-01-15T11:30:00Z',
  updatedAt: '2024-01-15T11:30:00Z'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (isLiveFirebaseConfigured) {
      const saved = localStorage.getItem('smartattend_current_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed.uid.startsWith('teacher_prof_') && !parsed.uid.startsWith('student_aarav_')) {
            return parsed;
          }
        } catch {
          return null;
        }
      }
      return null;
    }
    return DEMO_TEACHER;
  });

  const [currentOrg, setCurrentOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem('smartattend_current_org');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ORGANIZATION;
      }
    }
    return INITIAL_ORGANIZATION;
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

            // Fetch organization details if available
            if (profile.organizationId) {
              const orgDoc = await getDoc(doc(db, 'organizations', profile.organizationId));
              if (orgDoc.exists()) {
                const orgData = orgDoc.data() as Organization;
                setCurrentOrg(orgData);
                localStorage.setItem('smartattend_current_org', JSON.stringify(orgData));
              }
            }
          }
        } catch (e) {
          console.error('Failed to fetch Firestore user profile:', e);
        }
      } else {
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

        if (profile.organizationId) {
          const orgDoc = await getDoc(doc(db, 'organizations', profile.organizationId));
          if (orgDoc.exists()) {
            const orgData = orgDoc.data() as Organization;
            setCurrentOrg(orgData);
            localStorage.setItem('smartattend_current_org', JSON.stringify(orgData));
          }
        }
        return { success: true };
      }
      return { success: false, error: 'User authenticated, but no profile document found in Firestore.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    } finally {
      setLoading(false);
    }
  };

  // Register Student or Professor joining an existing organization via Organization Code
  const registerUser = async (
    email: string, 
    pass: string, 
    profileData: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>,
    orgCode: string
  ) => {
    const cleanOrgCode = orgCode.trim().toUpperCase();

    if (!isLiveFirebaseConfigured) {
      // Mock / Offline support
      const mockProfile: UserProfile = {
        ...profileData,
        uid: `user_${Date.now()}`,
        organizationId: cleanOrgCode === 'APEX101' ? 'org_apex_tech' : `org_${cleanOrgCode}`,
        organizationCode: cleanOrgCode,
        organizationName: cleanOrgCode === 'APEX101' ? 'Apex Institute of Technology' : `Institute (${cleanOrgCode})`,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentUser(mockProfile);
      localStorage.setItem('smartattend_current_user', JSON.stringify(mockProfile));
      return { success: true };
    }

    try {
      setLoading(true);

      let orgDocId = cleanOrgCode === 'APEX101' ? 'org_apex_tech' : `org_${cleanOrgCode.toLowerCase()}`;
      let orgName = cleanOrgCode === 'APEX101' ? 'Apex Institute of Technology' : `Institute (${cleanOrgCode})`;
      let orgData: Organization = {
        id: orgDocId,
        code: cleanOrgCode,
        name: orgName,
        adminEmail: email,
        createdAt: new Date().toISOString()
      };

      // Verify organization code in Firestore (if permitted)
      try {
        const orgQuery = query(collection(db, 'organizations'), where('code', '==', cleanOrgCode));
        const orgSnap = await getDocs(orgQuery);
        if (!orgSnap.empty) {
          const orgDoc = orgSnap.docs[0];
          orgData = orgDoc.data() as Organization;
          orgDocId = orgDoc.id;
          orgName = orgData.name;
        } else if (cleanOrgCode !== 'APEX101') {
          // If query succeeded and code really does not exist
          return { 
            success: false, 
            error: `Organization Code "${cleanOrgCode}" not found. Please verify with your college administrator, or create a new organization.` 
          };
        }
      } catch (permErr: any) {
        console.warn('Firestore query notice (permissions or offline). Proceeding with code:', cleanOrgCode, permErr);
      }

      let userUid = `user_${Date.now()}`;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        userUid = cred.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, pass);
            userUid = cred.user.uid;
          } catch {
            return { success: false, error: 'Email already registered. Please sign in or use another email.' };
          }
        } else {
          console.warn('Firebase auth notice:', authErr);
        }
      }

      const newProfile: UserProfile = {
        ...profileData,
        uid: userUid,
        organizationId: orgDocId,
        organizationCode: cleanOrgCode,
        organizationName: orgName,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'users', userUid), newProfile);
      } catch (dbErr: any) {
        console.warn('Firestore user doc write notice:', dbErr);
      }

      // Store in all users cache for directory & admin visibility
      try {
        const existingAll: UserProfile[] = JSON.parse(localStorage.getItem('smartattend_all_users') || '[]');
        const updatedAll = [newProfile, ...existingAll.filter(u => u.uid !== newProfile.uid && u.email !== newProfile.email)];
        localStorage.setItem('smartattend_all_users', JSON.stringify(updatedAll));
      } catch {}

      setCurrentUser(newProfile);
      setCurrentOrg(orgData);
      localStorage.setItem('smartattend_current_user', JSON.stringify(newProfile));
      localStorage.setItem('smartattend_current_org', JSON.stringify(orgData));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  // Create brand new Organization (for any college / institute) and register the first Professor/Admin
  const createOrganizationAndRegisterAdmin = async (
    orgName: string,
    orgCode: string,
    city: string,
    adminEmail: string,
    adminPass: string,
    adminName: string,
    department: string,
    facultyId?: string
  ) => {
    const cleanCode = orgCode.trim().toUpperCase();
    const cleanName = orgName.trim();

    if (!isLiveFirebaseConfigured) {
      const mockOrg: Organization = {
        id: `org_${cleanCode.toLowerCase()}`,
        code: cleanCode,
        name: cleanName,
        city: city.trim(),
        adminEmail: adminEmail.trim(),
        createdAt: new Date().toISOString()
      };
      const mockProfile: UserProfile = {
        uid: `teacher_${Date.now()}`,
        fullName: adminName.trim(),
        email: adminEmail.trim(),
        role: 'teacher',
        facultyId: facultyId?.trim() || 'FAC-01',
        department: department.trim(),
        organizationId: mockOrg.id,
        organizationCode: mockOrg.code,
        organizationName: mockOrg.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCurrentOrg(mockOrg);
      setCurrentUser(mockProfile);
      localStorage.setItem('smartattend_current_org', JSON.stringify(mockOrg));
      localStorage.setItem('smartattend_current_user', JSON.stringify(mockProfile));
      return { success: true };
    }

    try {
      setLoading(true);

      // Check if code is already taken (safely)
      try {
        const existingQuery = query(collection(db, 'organizations'), where('code', '==', cleanCode));
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) {
          return { success: false, error: `Organization Code "${cleanCode}" is already taken. Please choose another unique code.` };
        }
      } catch (checkErr: any) {
        console.warn('Could not query organizations collection (permissions or offline mode):', checkErr);
      }

      // Create new Auth account
      let userUid = `teacher_${Date.now()}`;
      try {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        userUid = cred.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
            userUid = cred.user.uid;
          } catch {
            return { success: false, error: 'Email already registered. Please sign in or use another email.' };
          }
        } else {
          console.warn('Firebase auth notice:', authErr);
        }
      }

      const orgId = cleanCode === 'APEX101' ? 'org_apex_tech' : `org_${cleanCode.toLowerCase()}`;
      const newOrg: Organization = {
        id: orgId,
        code: cleanCode,
        name: cleanName,
        city: city.trim(),
        adminEmail: adminEmail.trim(),
        adminName: adminName.trim(),
        departments: [
          department.trim(),
          'Information Technology',
          'Electronics & Telecommunication',
          'Mechanical Engineering',
          'Civil Engineering'
        ],
        createdAt: new Date().toISOString()
      };

      const adminProfile: UserProfile = {
        uid: userUid,
        fullName: adminName.trim(),
        email: adminEmail.trim(),
        role: 'admin',
        facultyId: facultyId?.trim() || 'DIR-01',
        department: department.trim(),
        organizationId: orgId,
        organizationCode: cleanCode,
        organizationName: cleanName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Attempt saving to Firestore
      try {
        await setDoc(doc(db, 'organizations', orgId), newOrg);
        await setDoc(doc(db, 'users', userUid), adminProfile);
      } catch (dbErr: any) {
        console.warn('Firestore write permission notice. Proceeding with active session:', dbErr);
      }

      // Store in all users cache for directory & admin visibility
      try {
        const existingAll: UserProfile[] = JSON.parse(localStorage.getItem('smartattend_all_users') || '[]');
        const updatedAll = [adminProfile, ...existingAll.filter(u => u.uid !== adminProfile.uid && u.email !== adminProfile.email)];
        localStorage.setItem('smartattend_all_users', JSON.stringify(updatedAll));
      } catch {}

      // Always set active session so user is never blocked by rules!
      setCurrentOrg(newOrg);
      setCurrentUser(adminProfile);
      localStorage.setItem('smartattend_current_org', JSON.stringify(newOrg));
      localStorage.setItem('smartattend_current_user', JSON.stringify(adminProfile));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create organization.' };
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
    let user = DEMO_TEACHER;
    if (role === 'student') user = DEMO_STUDENT;
    if (role === 'admin') user = DEMO_ADMIN;
    setCurrentUser(user);
    setCurrentOrg(INITIAL_ORGANIZATION);
    localStorage.setItem('smartattend_current_user', JSON.stringify(user));
    localStorage.setItem('smartattend_current_org', JSON.stringify(INITIAL_ORGANIZATION));
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
        currentOrg,
        loading,
        isLiveFirebase: isLiveFirebaseConfigured,
        loginWithEmail,
        registerUser,
        createOrganizationAndRegisterAdmin,
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
