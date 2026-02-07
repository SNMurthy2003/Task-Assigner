import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../services/api';
import Loader from '../components/Loader';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const AdminTasks = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [statusForm, setStatusForm] = useState('Pending');
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', status: 'Pending' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      openCreate();
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes] = await Promise.all([api.getTasks(), api.getUsers()]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', assignedTo: '', status: 'Pending' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo || '',
      status: task.status,
    });
    setViewingTask(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingTask) {
        const { data } = await api.updateTask(editingTask.id, form);
        setTasks(tasks.map(t => t.id === editingTask.id ? data : t));
      } else {
        const { data } = await api.createTask(form);
        setTasks([data, ...tasks]);
      }
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const openDeleteModal = (id) => {
    setDeletingTaskId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    try {
      await api.deleteTask(deletingTaskId);
      setTasks(tasks.filter(t => t.id !== deletingTaskId));
      if (viewingTask?.id === deletingTaskId) setViewingTask(null);
      setShowDeleteModal(false);
      setDeletingTaskId(null);
    } catch {
      setError('Failed to delete task');
    }
  };

  const openStatusModal = () => {
    if (!viewingTask) return;
    setStatusForm(viewingTask.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!viewingTask) return;
    try {
      const { data } = await api.updateTask(viewingTask.id, { status: statusForm });
      setTasks(tasks.map(t => t.id === viewingTask.id ? data : t));
      setViewingTask(data);
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

  if (loading) return <Loader />;

  return (
    <div className="tasks-page-layout">
      <div className={`tasks-main ${viewingTask ? 'tasks-main-shrink' : ''}`}>
        <div className="page-header">
          <div>
            <h2 className="page-title">All Tasks</h2>
            <p className="page-subtitle">Manage, assign, and track tasks across your team</p>
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
          <button className="btn-create" onClick={openCreate}>+ Create Task</button>
        </div>

        <div className="tasks-table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Created At</th>
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
                  <tr key={task.id} className={viewingTask?.id === task.id ? 'row-active' : ''}>
                    <td className="task-id">#{task.id.slice(0, 5).toUpperCase()}</td>
                    <td className="task-title-cell">{task.title}</td>
                    <td>{task.assignedToName || 'Unassigned'}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>{new Date(task.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-view" onClick={() => setViewingTask(task)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Side Panel */}
      {viewingTask && (
        <div className="side-panel">
          <div className="side-panel-header">
            <h3>Task Details</h3>
            <button className="side-panel-close" onClick={() => setViewingTask(null)}>&times;</button>
          </div>

          <div className="side-panel-body">
            {/* Status card with orange/peach background */}
            <div className="status-card">
              <div className="status-card-left">
                <span className="status-card-label">Status</span>
                <span className={`status-text ${getStatusClass(viewingTask.status)}`}>
                  {viewingTask.status}
                </span>
              </div>
              <button className="btn-update-status" onClick={openStatusModal}>Update status</button>
            </div>

            <div className="side-panel-section">
              <span className="side-panel-label">Task Title</span>
              <span className="side-panel-value">{viewingTask.title}</span>
            </div>

            <div className="side-panel-row-group">
              <div className="side-panel-section side-panel-half">
                <span className="side-panel-label">Assigned To</span>
                <span className="side-panel-value">{viewingTask.assignedToName || 'Unassigned'}</span>
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

          <div className="side-panel-footer">
            <button className="btn-delete-outline" onClick={() => openDeleteModal(viewingTask.id)}>Delete</button>
            <button className="btn-primary" onClick={() => openEdit(viewingTask)}>Edit Task</button>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && viewingTask && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal status-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Task Status</h2>
              <button className="side-panel-close" onClick={() => setShowStatusModal(false)}>&times;</button>
            </div>

            <div className="status-modal-body">
              <div className="status-modal-info">
                <span className="side-panel-label">Task Title</span>
                <span className="side-panel-value">{viewingTask.title}</span>
              </div>

              <div className="status-modal-row">
                <div className="status-modal-info">
                  <span className="side-panel-label">Status</span>
                  <span className={`status-badge ${getStatusClass(viewingTask.status)}`}>
                    {viewingTask.status}
                  </span>
                </div>
                <div className="status-modal-info">
                  <span className="side-panel-label">Assigned</span>
                  <span className="side-panel-value">{viewingTask.assignedToName || 'Unassigned'}</span>
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
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleStatusUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <button className="side-panel-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Task title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Enter task title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Briefly describe what needs to be done"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Assigned User Dropdown</label>
                <select
                  value={form.assignedTo}
                  onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <option value="">Select a user</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              {!editingTask && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div></div>
              <button className="side-panel-close" onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <div className="delete-modal-body">
              <h2 className="delete-modal-title">Delete this task?</h2>
              <p className="delete-modal-text">This action cannot be undone. The task will be permanently removed.</p>
            </div>
            <div className="modal-actions delete-modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTasks;
