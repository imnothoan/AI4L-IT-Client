import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store';
import LoginPage from '@/pages/LoginPage';
import InstructorDashboard from '@/pages/InstructorDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import ExamCreator from '@/pages/ExamCreator';
import ExamTaking from '@/pages/ExamTaking';
import ClassManagement from '@/pages/ClassManagement';
import MonitoringDashboard from '@/pages/MonitoringDashboard';
import AnalyticsDashboard from '@/pages/AnalyticsDashboard';
import QuestionBank from '@/pages/QuestionBank';
import UserGuide from '@/pages/UserGuide';
import UserProfile from '@/pages/UserProfile';

function App() {
  const { isAuthenticated, currentUser } = useStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                currentUser?.role === 'instructor' ? (
                  <Navigate to="/instructor" replace />
                ) : (
                  <Navigate to="/student" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <InstructorDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor/exam/create"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <ExamCreator />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor/class/:classId"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <ClassManagement />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor/monitoring"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <MonitoringDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor/analytics"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <AnalyticsDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/instructor/question-bank"
            element={
              isAuthenticated && currentUser?.role === 'instructor' ? (
                <QuestionBank />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />


          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <UserProfile />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/guide"
            element={<UserGuide />}
          />

          <Route
            path="/student"
            element={
              isAuthenticated && currentUser?.role === 'student' ? (
                <StudentDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/exam/:examId"
            element={
              isAuthenticated && currentUser?.role === 'student' ? (
                <ExamTaking />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
