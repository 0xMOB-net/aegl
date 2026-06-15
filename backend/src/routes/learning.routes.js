const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/learning.controller');

router.use(authenticate);

// ── User search ───────────────────────────────────────────────────────────
router.get('/users/search', ctrl.searchUsers);

// ── Courses ───────────────────────────────────────────────────────────────
router.get('/courses',     ctrl.listCourses);
router.get('/courses/:id', ctrl.getCourse);

router.post('/courses',       requireRole('admin'), ctrl.createCourse);
router.put('/courses/:id',    requireRole('admin'), ctrl.updateCourse);
router.delete('/courses/:id', requireRole('admin'), ctrl.deleteCourse);

// ── Lessons ───────────────────────────────────────────────────────────────
router.post('/courses/:courseId/lessons',             ctrl.createLesson);
router.put('/courses/:courseId/lessons/:lessonId',    ctrl.updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', ctrl.deleteLesson);
router.post('/lessons/:lessonId/complete',            ctrl.completeLesson);

// ── Resources ─────────────────────────────────────────────────────────────
router.get('/resources',         ctrl.listResources);
router.post('/resources',        ctrl.createResource);
router.post('/resources/upload', upload.single('file'), ctrl.uploadResource);
router.delete('/resources/:id',  ctrl.deleteResource);

// ── Quizzes ───────────────────────────────────────────────────────────────
router.post('/quizzes',            ctrl.createQuiz);
router.put('/quizzes/:id',         ctrl.updateQuiz);
router.delete('/quizzes/:id',      ctrl.deleteQuiz);
router.post('/quizzes/:id/submit', ctrl.submitQuiz);

// ── Stats & invitations ───────────────────────────────────────────────────
router.get('/my-stats',       ctrl.myStats);
router.get('/my-invitations', ctrl.myInvitations);

// ── Course Enrollments ────────────────────────────────────────────────────
router.post('/courses/:id/enroll',                ctrl.requestEnrollment);
router.post('/courses/:id/invite',                ctrl.inviteToCourse);
router.post('/enrollments/:enrollmentId/respond', ctrl.respondToInvitation);
router.get('/courses/:id/enrollments',            ctrl.listEnrollments);
router.post('/courses/:id/members',               ctrl.addMember);
router.patch('/enrollments/:enrollmentId',        ctrl.updateEnrollment);
router.delete('/courses/:id/members/:userId',     ctrl.removeMember);

// ── Course Messages ───────────────────────────────────────────────────────
router.get('/courses/:id/messages',              ctrl.getCourseMessages);
router.post('/courses/:id/messages', upload.single('file'), ctrl.sendCourseMessage);
router.delete('/messages/:messageId',            ctrl.deleteCourseMessage);

// ── Course Meetings (Planning / Réunions) ─────────────────────────────────
router.get('/courses/:id/meetings',           ctrl.listMeetings);
router.post('/courses/:id/meetings',          ctrl.createMeeting);
router.put('/meetings/:meetingId',            ctrl.updateMeeting);
router.delete('/meetings/:meetingId',         ctrl.deleteMeeting);

// ── Classes / Promos ──────────────────────────────────────────────────────
router.get('/classes/public', ctrl.listPublicClasses);
router.get('/classes',        ctrl.listClasses);
router.get('/classes/:id',    ctrl.getClass);

router.post('/classes',        requireRole('admin'), ctrl.createClass);
router.put('/classes/:id',     requireRole('admin'), ctrl.updateClass);
router.delete('/classes/:id',  requireRole('admin'), ctrl.deleteClass);

// ── Class Members ─────────────────────────────────────────────────────────
router.get('/classes/:id/members',              ctrl.listClassMembers);
router.post('/classes/:id/invite',              ctrl.inviteToClass);
router.post('/classes/:id/members',             requireRole('admin'), ctrl.addClassMember);
router.post('/classes/:id/join',                ctrl.requestJoinClass);
router.patch('/class-members/:memberId',        ctrl.updateClassMember);
router.post('/class-members/:memberId/respond', ctrl.respondToClassInvitation);
router.delete('/classes/:id/members/:userId',   ctrl.removeClassMember);

// ── Class Courses ─────────────────────────────────────────────────────────
router.post('/classes/:id/courses',             requireRole('admin'), ctrl.addCourseToClass);
router.delete('/classes/:id/courses/:courseId', requireRole('admin'), ctrl.removeCourseFromClass);

// ── Class Messages ────────────────────────────────────────────────────────
router.get('/classes/:id/messages',              ctrl.getClassMessages);
router.post('/classes/:id/messages', upload.single('file'), ctrl.sendClassMessage);
router.delete('/class-messages/:messageId',      ctrl.deleteClassMessage);

// ── Class Resources (Bibliothèque de la classe) ───────────────────────────
router.get('/classes/:id/resources',              ctrl.listClassResources);
router.post('/classes/:id/resources',             ctrl.createClassResource);
router.post('/classes/:id/resources/upload', upload.single('file'), ctrl.uploadClassResource);
router.delete('/class-resources/:resourceId',     ctrl.deleteClassResource);

module.exports = router;
