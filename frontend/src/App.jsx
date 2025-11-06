import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AppLayout from "./components/AppLayout";
import LoadingSpinner from "./components/LoadingSpinner";

// Import the new page components
import UsersPage from "./pages/users";
import PostsPage from "./pages/posts";
import MessagesPage from "./pages/messages";
import CalendarPage from "./pages/calendar";
import AnalyticsPage from "./pages/analytics";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!user.isVerified) {
    return <Navigate to='/verify-email' replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// redirect authenticated users to the home page
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to='/' replace />;
  }

  return children;
};

// Public route layout
const PublicRoute = () => (
  <div className='min-h-screen bg-background flex items-center justify-center p-4'>
    <Outlet />
  </div>
);

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <>
      <Toaster position='top-right' />
      <FloatingShape />
      
      <Routes>
        <Route element={<PublicRoute />}>
          <Route
            path='/signup'
            element={
              <RedirectAuthenticatedUser>
                <SignUpPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path='/login'
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route 
            path='/verify-email' 
            element={
              <RedirectAuthenticatedUser>
                <EmailVerificationPage />
              </RedirectAuthenticatedUser>
            } 
          />
          <Route
            path='/forgot-password'
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
          <Route
            path='/reset-password/:token'
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />
        </Route>
        
        <Route element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path='dashboard' element={<DashboardPage />} />
          <Route path='users' element={<UsersPage />}>
            <Route path=':id' element={<UsersPage />} />
          </Route>
          <Route path='posts' element={<PostsPage />} />
          <Route path='messages' element={<MessagesPage />} />
          <Route path='calendar' element={<CalendarPage />} />
          <Route path='analytics' element={<AnalyticsPage />} />
          <Route path='settings' element={<ChangePasswordPage />} />
          <Route path='change-password' element={<ChangePasswordPage />} />
        </Route>
        
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </>
  );
}

export default App;
