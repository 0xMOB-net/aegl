const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/messages.controller');

router.use(authenticate);

// Routes membres (student / host) — routes spécifiques avant /:messageId
router.get('/unread-count', ctrl.getMemberUnreadCount);
router.get('/broadcasts', ctrl.getMyBroadcasts);
router.post('/broadcasts/:broadcastId/react', ctrl.reactToBroadcast);
router.get('/', ctrl.getMyMessages);
router.post('/', upload.single('file'), ctrl.sendMessage);
router.patch('/:messageId', ctrl.editMyMessage);
router.delete('/:messageId', ctrl.deleteMyMessage);

// Routes admin — routes spécifiques avant /:messageId
router.get('/admin/threads', requireRole('admin'), ctrl.getAdminThreads);
router.get('/admin/unread-count', requireRole('admin'), ctrl.getAdminUnreadCount);
router.get('/admin/thread/:memberId', requireRole('admin'), ctrl.getAdminThread);
router.post('/admin/reply/:memberId', requireRole('admin'), upload.single('file'), ctrl.adminReply);
router.delete('/admin/thread/:memberId', requireRole('admin'), ctrl.deleteThread);
router.patch('/admin/message/:messageId', requireRole('admin'), ctrl.adminEditMessage);
router.delete('/admin/message/:messageId', requireRole('admin'), ctrl.adminDeleteMessage);
router.get('/admin/broadcasts', requireRole('admin'), ctrl.getAdminBroadcasts);
router.post('/admin/broadcast', requireRole('admin'), upload.single('file'), ctrl.sendBroadcast);
router.delete('/admin/broadcast/:broadcastId', requireRole('admin'), ctrl.deleteBroadcast);

module.exports = router;
