import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import Loader from '../components/Loader';

const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.getTasks();
        setTasks(data);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <Loader />;

  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  const stats = [
    { label: 'Total Tasks', count: total, color: '#6366f1', bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' },
    { label: 'Pending Tasks', count: pending, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { label: 'In Progress Tasks', count: inProgress, color: '#22c55e', bg: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' },
    { label: 'Completed Tasks', count: completed, color: '#8b5cf6', bg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' },
  ];

  // Generate mini bar chart data
  const generateBars = (count, max) => {
    const bars = [];
    for (let i = 0; i < 12; i++) {
      const height = max > 0 ? Math.random() * 0.6 + 0.2 : 0.1;
      bars.push(height);
    }
    return bars;
  };

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <div className="stat-cards">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-count">{stat.count}</span>
            </div>
            <div className="stat-chart">
              {generateBars(stat.count, total).map((h, i) => (
                <div
                  key={i}
                  className="stat-bar"
                  style={{
                    height: `${h * 48}px`,
                    background: stat.bg,
                    opacity: 0.4 + h * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-title">Quick Actions</h3>
      <div className="quick-actions">
        <div className="quick-action-card" onClick={() => navigate('/admin/tasks')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div>
            <h4>All Tasks</h4>
            <p>View and manage all tasks</p>
          </div>
        </div>
        <div className="quick-action-card" onClick={() => navigate('/admin/tasks?create=true')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <div>
            <h4>Create Task</h4>
            <p>Add a new task and assign it</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
