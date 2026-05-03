const router = require('express').Router();
const { register, login, resetPassword, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);

module.exports = router;
