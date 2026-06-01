const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ─── Models ───────────────────────────────────────────────────
db.School             = require('./School')(sequelize, Sequelize);
db.User               = require('./User')(sequelize, Sequelize);
db.AcademicYear       = require('./AcademicYear')(sequelize, Sequelize);
db.Term               = require('./Term')(sequelize, Sequelize);
db.Grade              = require('./Grade')(sequelize, Sequelize);
db.Class              = require('./Class')(sequelize, Sequelize);
db.Subject            = require('./Subject')(sequelize, Sequelize);
db.Student            = require('./Student')(sequelize, Sequelize);
db.ClassSubject       = require('./ClassSubject')(sequelize, Sequelize);
db.Lesson             = require('./Lesson')(sequelize, Sequelize);
db.Homework           = require('./Homework')(sequelize, Sequelize);
db.HomeworkSubmission = require('./HomeworkSubmission')(sequelize, Sequelize);
db.Attendance         = require('./Attendance')(sequelize, Sequelize);
db.Assessment         = require('./Assessment')(sequelize, Sequelize);
db.AssessmentResult   = require('./AssessmentResult')(sequelize, Sequelize);
db.LessonProgress     = require('./LessonProgress')(sequelize, Sequelize);

// ─── School ───────────────────────────────────────────────────
db.School.hasMany(db.User,         { foreignKey: 'schoolId', as: 'users' });
db.School.hasMany(db.AcademicYear, { foreignKey: 'schoolId', as: 'academicYears' });
db.School.hasMany(db.Grade,        { foreignKey: 'schoolId', as: 'grades' });
db.School.hasMany(db.Class,        { foreignKey: 'schoolId', as: 'classes' });
db.School.hasMany(db.Subject,      { foreignKey: 'schoolId', as: 'subjects' });

// ─── User ─────────────────────────────────────────────────────
db.User.belongsTo(db.School, { foreignKey: 'schoolId', as: 'school' });
db.User.belongsTo(db.Class,  { foreignKey: 'classId',  as: 'class' });

// ─── AcademicYear ─────────────────────────────────────────────
db.AcademicYear.belongsTo(db.School, { foreignKey: 'schoolId',      as: 'school' });
db.AcademicYear.hasMany(db.Term,     { foreignKey: 'academicYearId', as: 'terms' });
db.AcademicYear.hasMany(db.Class,    { foreignKey: 'academicYearId', as: 'classes' });

// ─── Term ─────────────────────────────────────────────────────
db.Term.belongsTo(db.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

// ─── Grade ────────────────────────────────────────────────────
db.Grade.belongsTo(db.School, { foreignKey: 'schoolId', as: 'school' });
db.Grade.hasMany(db.Class,    { foreignKey: 'gradeId',  as: 'classes' });
db.Grade.hasMany(db.Subject,  { foreignKey: 'gradeId',  as: 'subjects' });

// ─── Class ────────────────────────────────────────────────────
db.Class.belongsTo(db.School,       { foreignKey: 'schoolId',      as: 'school' });
db.Class.belongsTo(db.Grade,        { foreignKey: 'gradeId',        as: 'grade' });
db.Class.belongsTo(db.AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });
db.Class.belongsTo(db.User,         { foreignKey: 'teacherId',      as: 'teacher' });

// ─── Subject ──────────────────────────────────────────────────
db.Subject.belongsTo(db.School, { foreignKey: 'schoolId', as: 'school' });
db.Subject.belongsTo(db.Grade,  { foreignKey: 'gradeId',  as: 'grade' });
db.Subject.belongsTo(db.Class,  { foreignKey: 'classId',  as: 'class' }); 

// ─── Student ──────────────────────────────────────────────────
db.Student.belongsTo(db.User,  { foreignKey: 'userId',   as: 'user' });
db.User.hasOne(db.Student,     { foreignKey: 'userId',   as: 'studentProfile' });
db.Student.belongsTo(db.Class, { foreignKey: 'classId',  as: 'class' });
db.Class.hasMany(db.Student,   { foreignKey: 'classId',  as: 'students' });
db.Student.belongsTo(db.User,  { foreignKey: 'parentId', as: 'parent' });
db.User.hasMany(db.Student,    { foreignKey: 'parentId', as: 'children' });

// ─── ClassSubject ─────────────────────────────────────────────
db.Class.hasMany(db.ClassSubject,     { foreignKey: 'classId',   as: 'classSubjects' });
db.ClassSubject.belongsTo(db.Class,   { foreignKey: 'classId',   as: 'class' });
db.Subject.hasMany(db.ClassSubject,   { foreignKey: 'subjectId', as: 'classSubjects' });
db.ClassSubject.belongsTo(db.Subject, { foreignKey: 'subjectId', as: 'subject' });
db.User.hasMany(db.ClassSubject,      { foreignKey: 'teacherId', as: 'teachingSubjects' });
db.ClassSubject.belongsTo(db.User,    { foreignKey: 'teacherId', as: 'teacher' });

// ─── Lesson ───────────────────────────────────────────────────
db.ClassSubject.hasMany(db.Lesson,    { foreignKey: 'classSubjectId', as: 'lessons' });
db.Lesson.belongsTo(db.ClassSubject,  { foreignKey: 'classSubjectId', as: 'classSubject' });
db.Term.hasMany(db.Lesson,            { foreignKey: 'termId',         as: 'lessons' });
db.Lesson.belongsTo(db.Term,          { foreignKey: 'termId',         as: 'term' });

// ─── LessonProgress ───────────────────────────────────────────
db.Lesson.hasMany(db.LessonProgress,         { foreignKey: 'lessonId', as: 'progress' });
db.LessonProgress.belongsTo(db.Lesson,       { foreignKey: 'lessonId', as: 'lesson' });
db.Student.hasMany(db.LessonProgress,        { foreignKey: 'pupilId',  as: 'lessonProgress' });
db.LessonProgress.belongsTo(db.Student,      { foreignKey: 'pupilId',  as: 'pupil' });

// ─── Homework ─────────────────────────────────────────────────
db.ClassSubject.hasMany(db.Homework,  { foreignKey: 'classSubjectId', as: 'homework' });
db.Homework.belongsTo(db.ClassSubject,{ foreignKey: 'classSubjectId', as: 'classSubject' });
db.Term.hasMany(db.Homework,          { foreignKey: 'termId',         as: 'homework' });
db.Homework.belongsTo(db.Term,        { foreignKey: 'termId',         as: 'term' });

// ─── HomeworkSubmission ───────────────────────────────────────
db.Homework.hasMany(db.HomeworkSubmission,       { foreignKey: 'homeworkId', as: 'submissions' });
db.HomeworkSubmission.belongsTo(db.Homework,     { foreignKey: 'homeworkId', as: 'homework' });
db.Student.hasMany(db.HomeworkSubmission,        { foreignKey: 'pupilId',    as: 'submissions' });
db.HomeworkSubmission.belongsTo(db.Student,      { foreignKey: 'pupilId',    as: 'pupil' });

// ─── Attendance ───────────────────────────────────────────────
db.Class.hasMany(db.Attendance,   { foreignKey: 'classId',    as: 'attendances' });
db.Attendance.belongsTo(db.Class, { foreignKey: 'classId',    as: 'class' });
db.Student.hasMany(db.Attendance, { foreignKey: 'pupilId',    as: 'attendances' });
db.Attendance.belongsTo(db.Student,{ foreignKey: 'pupilId',   as: 'student' });
db.User.hasMany(db.Attendance,    { foreignKey: 'recordedBy', as: 'recordedAttendances' });
db.Attendance.belongsTo(db.User,  { foreignKey: 'recordedBy', as: 'recorder' });

// ─── Assessment ───────────────────────────────────────────────
db.ClassSubject.hasMany(db.Assessment,    { foreignKey: 'classSubjectId', as: 'assessments' });
db.Assessment.belongsTo(db.ClassSubject,  { foreignKey: 'classSubjectId', as: 'classSubject' });
db.Term.hasMany(db.Assessment,            { foreignKey: 'termId',         as: 'assessments' });
db.Assessment.belongsTo(db.Term,          { foreignKey: 'termId',         as: 'term' });

// ─── AssessmentResult ─────────────────────────────────────────
db.Assessment.hasMany(db.AssessmentResult,    { foreignKey: 'assessmentId', as: 'results' });
db.AssessmentResult.belongsTo(db.Assessment,  { foreignKey: 'assessmentId', as: 'assessment' });
db.Student.hasMany(db.AssessmentResult,       { foreignKey: 'pupilId',      as: 'results' });
db.AssessmentResult.belongsTo(db.Student,     { foreignKey: 'pupilId',      as: 'student' });

module.exports = db;