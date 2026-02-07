import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Illustration from '../components/Illustration';

const RoleSelection = () => {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { selectRole } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async (role) => {
    setError('');
    setLoading(true);
    try {
      await selectRole(role);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-illustration">
        <Illustration />
      </div>
      <div className="auth-form-section">
        <div className="auth-form-card" style={{ maxWidth: 520 }}>
          <h1 className="auth-title">Choose Your Role</h1>
          <p className="auth-subtitle">
            Pick a role to begin. This will set your dashboard permissions.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <div className="role-cards">
            <div
              className={`role-card ${selected === 'admin' ? 'role-card-active' : ''}`}
              onClick={() => setSelected('admin')}
            >
              <h3>Admin</h3>
              <ul>
                <li>Create, edit, delete tasks</li>
                <li>Assign tasks to users</li>
                <li>View and manage all tasks</li>
                <li>Full dashboard access</li>
              </ul>
              <button
                className="role-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('admin');
                }}
                disabled={loading}
              >
                Continue as Admin
              </button>
            </div>

            <div
              className={`role-card ${selected === 'user' ? 'role-card-active' : ''}`}
              onClick={() => setSelected('user')}
            >
              <h3>User</h3>
              <ul>
                <li>View assigned tasks</li>
                <li>Update task status</li>
                <li>Track your progress</li>
                <li>Personal dashboard</li>
              </ul>
              <button
                className="role-btn role-btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinue('user');
                }}
                disabled={loading}
              >
                Continue as User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
