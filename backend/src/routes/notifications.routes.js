const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/notifications.controller');

router.use(authenticate);

router.get('/',                ctrl.listNotifications);
router.patch('/read-all',      ctrl.markAllRead);
router.patch('/:id/read',      ctrl.markRead);
router.delete('/:id',          ctrl.deleteNotif);

module.exports = router;
