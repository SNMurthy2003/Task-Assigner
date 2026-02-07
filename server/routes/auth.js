const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').where('email', '==', email).get();
    if (!existingUser.empty) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = db.collection('users').doc();
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      role: null, // role is selected after signup
      createdAt: new Date().toISOString(),
    };
    await userRef.set(userData);

    const token = jwt.sign(
      { uid: userRef.id, email, role: null, fullName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { uid: userRef.id, fullName, email, role: null },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', detail: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { uid: userDoc.id, email: userData.email, role: userData.role, fullName: userData.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { uid: userDoc.id, fullName: userData.fullName, email: userData.email, role: userData.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/select-role
router.post('/select-role', auth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await db.collection('users').doc(req.user.uid).update({ role });

    const token = jwt.sign(
      { uid: req.user.uid, email: req.user.email, role, fullName: req.user.fullName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { uid: req.user.uid, fullName: req.user.fullName, email: req.user.email, role },
    });
  } catch (error) {
    console.error('Select role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
