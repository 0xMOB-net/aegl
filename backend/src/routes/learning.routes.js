const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/learning.controller');

router.use(authenticate);

// ── Courses ───────────────────────────────────────────────────────────────
router.get('/courses',    ctrl.listCourses);
router.get('/courses/:id', ctrl.getCourse);

router.post('/courses',     requireRole('admin'), ctrl.createCourse);
router.put('/courses/:id',  requireRole('admin'), ctrl.updateCourse);
router.delete('/courses/:id', requireRole('admin'), ctrl.deleteCourse);

// ── Lessons ───────────────────────────────────────────────────────────────
router.post('/courses/:courseId/lessons',             ctrl.createLesson);
router.put('/courses/:courseId/lessons/:lessonId',    ctrl.updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', ctrl.deleteLesson);
router.post('/lessons/:lessonId/complete',            ctrl.completeLesson);

// ── Resources ─────────────────────────────────────────────────────────────
router.get('/resources',           ctrl.listResources);
router.post('/resources',          ctrl.createResource);
router.post('/resources/upload',   upload.single('file'), ctrl.uploadResource);
router.delete('/resources/:id',    requireRole('admin'), ctrl.deleteResource);

// ── Quizzes ───────────────────────────────────────────────────────────────
router.post('/quizzes',        ctrl.createQuiz);
router.put('/quizzes/:id',     ctrl.updateQuiz);
router.delete('/quizzes/:id',  requireRole('admin'), ctrl.deleteQuiz);
router.post('/quizzes/:id/submit', ctrl.submitQuiz);

// ── Stats ─────────────────────────────────────────────────────────────────
router.get('/my-stats', ctrl.myStats);

// ── Enrollments ───────────────────────────────────────────────────────────
router.post('/courses/:id/enroll',               ctrl.requestEnrollment);
router.get('/courses/:id/enrollments',           ctrl.listEnrollments);
router.post('/courses/:id/members',              ctrl.addMember);
router.patch('/enrollments/:enrollmentId',       ctrl.updateEnrollment);
router.delete('/courses/:id/members/:userId',    ctrl.removeMember);

// ── Course Messages ───────────────────────────────────────────────────────
router.get('/courses/:id/messages',              ctrl.getCourseMessages);
router.post('/courses/:id/messages', upload.single('file'), ctrl.sendCourseMessage);
router.delete('/messages/:messageId',            ctrl.deleteCourseMessage);

module.exports = router;
