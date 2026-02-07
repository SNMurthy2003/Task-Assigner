# Task Assigner

A full-stack Task Management Dashboard built with React.js, Node.js/Express, and Firebase Firestore.

## Features
- JWT Authentication (Signup, Login)
- Role-based access control (Admin / User)
- Admin: Create, edit, delete, and assign tasks
- User: View assigned tasks and update status
- Responsive design for mobile and desktop

## Tech Stack
- **Frontend:** React.js (Vite), React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** Firebase Firestore
- **Auth:** JWT + bcrypt

## Setup

### Backend
```bash
cd server
npm install
# Add your .env file with Firebase credentials and JWT_SECRET
node server.js
```

### Frontend
```bash
cd client
npm install
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.
