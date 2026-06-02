const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/messages.controller');

router.use(authenticate);

// Routes membres (student / host)
router.get('/', ctrl.getMyMessages);
router.post('/', upload.single('file'), ctrl.sendMessage);

// Routes admin
router.get('/admin/threads', requireRole('admin'), ctrl.getAdminThreads);
router.get('/admin/thread/:memberId', requireRole('admin'), ctrl.getAdminThread);
router.post('/admin/reply/:memberId', requireRole('admin'), upload.single('file'), ctrl.adminReply);

module.exports = router;
