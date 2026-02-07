const express = require('express');
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tasks - Get tasks (admin: all, user: assigned only)
router.get('/', async (req, res) => {
  try {
    let snapshot;

    if (req.user.role === 'user') {
      snapshot = await db.collection('tasks').where('assignedTo', '==', req.user.uid).get();
    } else {
      snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
    }

    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort user tasks in memory to avoid needing composite index
    if (req.user.role === 'user') {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create task (admin only)
router.post('/', roleCheck('admin'), async (req, res) => {
  try {
    const { title, description, assignedTo, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const taskData = {
      title,
      description: description || '',
      status: status || 'Pending',
      assignedTo: assignedTo || null,
      assignedToName: '',
      createdBy: req.user.uid,
      createdByName: req.user.fullName || 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get assigned user's name
    if (assignedTo) {
      const userDoc = await db.collection('users').doc(assignedTo).get();
      if (userDoc.exists) {
        taskData.assignedToName = userDoc.data().fullName;
      }
    }

    const taskRef = await db.collection('tasks').add(taskData);
    res.status(201).json({ id: taskRef.id, ...taskData });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const taskRef = db.collection('tasks').doc(req.params.id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    let updateData;

    if (req.user.role === 'admin') {
      const { title, description, assignedTo, status } = req.body;
      updateData = { updatedAt: new Date().toISOString() };
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
        if (assignedTo) {
          const userDoc = await db.collection('users').doc(assignedTo).get();
          if (userDoc.exists) {
            updateData.assignedToName = userDoc.data().fullName;
          }
        } else {
          updateData.assignedToName = '';
        }
      }
    } else {
      // User can only update status
      const { status } = req.body;
      if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }
      updateData = { status, updatedAt: new Date().toISOString() };
    }

    await taskRef.update(updateData);
    const updated = await taskRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', roleCheck('admin'), async (req, res) => {
  try {
    const taskRef = db.collection('tasks').doc(req.params.id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await taskRef.delete();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/users/list - Get all users (admin only, for task assignment)
router.get('/users/list', roleCheck('admin'), async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      fullName: doc.data().fullName,
      email: doc.data().email,
      role: doc.data().role,
    }));
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
