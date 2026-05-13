const router = require('express').Router();
const { register, login, resetPassword, me, updateProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateProfile);

module.exports = router;
