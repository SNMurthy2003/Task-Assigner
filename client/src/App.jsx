import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import AdminDashboard from './pages/AdminDashboard';
import AdminTasks from './pages/AdminTasks';
import UserDashboard from './pages/UserDashboard';
import Loader from './components/Loader';
import './App.css';

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={!user?.role ? '/select-role' : user.role === 'admin' ? '/admin' : '/dashboard'} />
            : <Login />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated
            ? <Navigate to={!user?.role ? '/select-role' : user.role === 'admin' ? '/admin' : '/dashboard'} />
            : <Signup />
        }
      />
      <Route
        path="/select-role"
        element={
          isAuthenticated
            ? (user?.role ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <RoleSelection />)
            : <Navigate to="/login" />
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="tasks" element={<AdminTasks />} />
      </Route>
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
