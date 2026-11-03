import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { LiveAttendanceScreen } from './pages/teacher/LiveAttendanceScreen';
import { StudentQRScanner } from './pages/student/StudentQRScanner';
import { TeacherCourses } from './pages/teacher/TeacherCourses';
import { TeacherEnrollmentRequests } from './pages/teacher/TeacherEnrollmentRequests';
import { TakeAttendance } from './pages/teacher/TakeAttendance';
import { ManageStudents } from './pages/teacher/ManageStudents';
import { AttendanceHistory } from './pages/teacher/AttendanceHistory';
import { AttendanceReports } from './pages/teacher/AttendanceReports';
import { JoinCourse } from './pages/student/JoinCourse';
import { Profile } from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'teacher' | 'student' }> = ({ 
  children, 
  allowedRole 
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Main Application Shell */}
            <Route element={<Layout />}>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/teacher" replace />} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/teacher/courses" element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherCourses />
                </ProtectedRoute>
              } />
              <Route path="/teacher/students" element={
                <ProtectedRoute allowedRole="teacher">
                  <ManageStudents />
                </ProtectedRoute>
              } />
              <Route path="/teacher/take-attendance" element={
                <ProtectedRoute allowedRole="teacher">
                  <TakeAttendance />
                </ProtectedRoute>
              } />
              <Route path="/teacher/live-session" element={
                <ProtectedRoute allowedRole="teacher">
                  <LiveAttendanceScreen />
                </ProtectedRoute>
              } />
              <Route path="/teacher/history" element={
                <ProtectedRoute allowedRole="teacher">
                  <AttendanceHistory />
                </ProtectedRoute>
              } />
              <Route path="/teacher/reports" element={
                <ProtectedRoute allowedRole="teacher">
                  <AttendanceReports />
                </ProtectedRoute>
              } />
              <Route path="/teacher/requests" element={
                <ProtectedRoute allowedRole="teacher">
                  <TeacherEnrollmentRequests />
                </ProtectedRoute>
              } />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/courses" element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/scan" element={
                <ProtectedRoute allowedRole="student">
                  <StudentQRScanner />
                </ProtectedRoute>
              } />
              <Route path="/student/join" element={
                <ProtectedRoute allowedRole="student">
                  <JoinCourse />
                </ProtectedRoute>
              } />
              <Route path="/student/history" element={
                <ProtectedRoute allowedRole="student">
                  <AttendanceHistory />
                </ProtectedRoute>
              } />

              {/* Shared Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;

