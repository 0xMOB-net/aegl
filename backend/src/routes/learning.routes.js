const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const ctrl = require('../controllers/learning.controller');

router.use(authenticate);

// Lecture — tous les membres connectés
router.get('/courses',             ctrl.listCourses);
router.get('/courses/:id',         ctrl.getCourse);
router.get('/resources',           ctrl.listResources);
router.get('/my-stats',            ctrl.myStats);

// Actions membres
router.post('/lessons/:lessonId/complete', ctrl.completeLesson);
router.post('/quizzes/:id/submit',         ctrl.submitQuiz);

// Admin uniquement
router.post('/courses',                            requireRole('admin'), ctrl.createCourse);
router.put('/courses/:id',                         requireRole('admin'), ctrl.updateCourse);
router.delete('/courses/:id',                      requireRole('admin'), ctrl.deleteCourse);
router.post('/courses/:courseId/lessons',          requireRole('admin'), ctrl.createLesson);
router.put('/courses/:courseId/lessons/:lessonId', requireRole('admin'), ctrl.updateLesson);
router.delete('/courses/:courseId/lessons/:lessonId', requireRole('admin'), ctrl.deleteLesson);
router.post('/resources',                          requireRole('admin'), ctrl.createResource);
router.delete('/resources/:id',                    requireRole('admin'), ctrl.deleteResource);
router.post('/quizzes',                            requireRole('admin'), ctrl.createQuiz);
router.put('/quizzes/:id',                         requireRole('admin'), ctrl.updateQuiz);
router.delete('/quizzes/:id',                      requireRole('admin'), ctrl.deleteQuiz);

module.exports = router;
