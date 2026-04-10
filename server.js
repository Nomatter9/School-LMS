const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const db = require('./models');

// Load env
dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static uploads folder ────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Routes ───────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class.routes');
const gradeRoutes = require('./routes/grade.routes');
const subjectRoutes = require('./routes/subject.routes');
const academicYearRoutes = require('./routes/academicYear.routes');
const studentRoutes = require('./routes/student.routes');
const termRoutes = require('./routes/term.routes');
const teacherRoutes = require('./routes/teacher.routes');


app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academicYear', academicYearRoutes); 
app.use('/api/teacher', teacherRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/students', studentRoutes);
app.use('/uploads', express.static('uploads'));
// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ message: '✅ School LMS API is running' });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ─── Database + Server Start ──────────────────────────────────
const PORT = process.env.PORT || 5000;

db.sequelize.sync()
  .then(() => {
    console.log('✅ Database synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB sync error:', err);
  });