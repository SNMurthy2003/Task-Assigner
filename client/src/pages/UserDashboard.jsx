import { useState, useEffect } from 'react';
import * as api from '../services/api';
import Loader from '../components/Loader';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewingTask, setViewingTask] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState('Pending');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.getTasks();
      setTasks(data);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (task) => {
    setUpdatingTaskId(task.id);
    setStatusForm(task.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!updatingTaskId) return;
    try {
      const { data } = await api.updateTask(updatingTaskId, { status: statusForm });
      setTasks(tasks.map(t => t.id === updatingTaskId ? data : t));
      if (viewingTask?.id === updatingTaskId) setViewingTask(data);
      setShowStatusModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-inprogress';
      default: return 'status-pending';
    }
  };

  const filteredTasks = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;

  const stats = [
    { label: 'My Tasks', subtitle: 'All tasks assigned to you', count: total, color: '#6366f1', bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' },
    { label: 'Pending Tasks', subtitle: 'Tasks waiting to be started', count: pending, color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    { label: 'In Progress', subtitle: 'Tasks you\'re currently working on', count: inProgress, color: '#22c55e', bg: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' },
    { label: 'Completed Tasks', subtitle: 'Tasks you\'ve finished', count: completed, color: '#8b5cf6', bg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' },
  ];

  const generateBars = (max) => {
    const bars = [];
    for (let i = 0; i < 12; i++) {
      const height = max > 0 ? Math.random() * 0.6 + 0.2 : 0.1;
      bars.push(height);
    }
    return bars;
  };

  const updatingTask = tasks.find(t => t.id === updatingTaskId);

  if (loading) return <Loader />;

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-cards">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-sublabel">{stat.subtitle}</span>
              <span className="stat-count">{stat.count}</span>
            </div>
            <div className="stat-chart">
              {generateBars(stat.count).map((h, i) => (
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

      {/* My Tasks Section */}
      <div className="page-header" style={{ marginTop: 32 }}>
        <div>
          <h2 className="page-title">My Tasks</h2>
          <p className="page-subtitle">Track and update your assigned tasks.</p>
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div className="tasks-toolbar">
        <div className="filter-tabs">
          {['All', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              className={`filter-tab ${filter === s ? 'filter-tab-active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="tasks-table-wrapper">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Assigned To</th>
              <th>Task Title</th>
              <th>Assigned By</th>
              <th>Status</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">No tasks found</td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td className="task-id">#{task.id.slice(0, 5).toUpperCase()}</td>
                  <td className="task-title-cell">{task.title}</td>
                  <td>{task.createdByName || 'Admin'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{new Date(task.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-view" onClick={() => setViewingTask(task)}>View</button>
                      <button className="btn-update-status-table" onClick={() => openStatusModal(task)}>Update Status</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task Details Modal (View) */}
      {viewingTask && !showStatusModal && (
        <div className="modal-overlay" onClick={() => setViewingTask(null)}>
          <div className="modal user-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Status</h2>
              <button className="side-panel-close" onClick={() => setViewingTask(null)}>&times;</button>
            </div>

            <div className="user-detail-modal-body">
              {/* Status row with Update status button */}
              <div className="status-card">
                <div className="status-card-left">
                  <span className="status-card-label">Status</span>
                  <span className={`status-text ${getStatusClass(viewingTask.status)}`}>
                    {viewingTask.status}
                  </span>
                </div>
                <button className="btn-update-status" onClick={() => openStatusModal(viewingTask)}>Update status</button>
              </div>

              <div className="side-panel-section">
                <span className="side-panel-label">Task Title</span>
                <span className="side-panel-value">{viewingTask.title}</span>
              </div>

              <div className="side-panel-row-group">
                <div className="side-panel-section side-panel-half">
                  <span className="side-panel-label">Assigned By</span>
                  <span className="side-panel-value">{viewingTask.createdByName || 'Admin'}</span>
                </div>
                <div className="side-panel-section side-panel-half">
                  <span className="side-panel-label">Task ID</span>
                  <span className="side-panel-value">#{viewingTask.id.slice(0, 5).toUpperCase()}</span>
                </div>
              </div>

              <div className="side-panel-section">
                <span className="side-panel-label">Description</span>
                <span className="side-panel-desc">
                  {viewingTask.description || 'No description provided for this task.'}
                </span>
              </div>

              <div className="side-panel-divider"></div>

              <div className="side-panel-section">
                <span className="side-panel-label">Activity History</span>
                <div className="activity-timeline">
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <span className="activity-text">Task created by Admin</span>
                      <span className="activity-date">
                        {new Date(viewingTask.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {', '}
                        {new Date(viewingTask.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-dot activity-dot-empty"></div>
                    <div className="activity-content">
                      <span className="activity-text-muted">
                        {viewingTask.status === 'Pending' && 'Task not started'}
                        {viewingTask.status === 'In Progress' && 'Task in progress'}
                        {viewingTask.status === 'Completed' && 'Task completed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setViewingTask(null)}>Close</button>
              <button className="btn-primary" onClick={() => openStatusModal(viewingTask)}>Update Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && updatingTask && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal status-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Status</h2>
              <button className="side-panel-close" onClick={() => setShowStatusModal(false)}>&times;</button>
            </div>

            <div className="status-modal-body">
              <div className="status-modal-info">
                <span className="side-panel-label">Status</span>
                <span className={`status-text ${getStatusClass(updatingTask.status)}`}>
                  {updatingTask.status}
                </span>
              </div>

              <div className="status-modal-info">
                <span className="side-panel-label">Task Title</span>
                <span className="side-panel-value">{updatingTask.title}</span>
              </div>

              <div className="status-modal-row">
                <div className="status-modal-info">
                  <span className="side-panel-label">Assigned By</span>
                  <span className="side-panel-value">{updatingTask.createdByName || 'Admin'}</span>
                </div>
                <div className="status-modal-info">
                  <span className="side-panel-label">Task ID</span>
                  <span className="side-panel-value">#{updatingTask.id.slice(0, 5).toUpperCase()}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Update status</label>
                <select
                  value={statusForm}
                  onChange={e => setStatusForm(e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <p className="status-modal-note">Changing the status will update it for the admin.</p>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleStatusUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
