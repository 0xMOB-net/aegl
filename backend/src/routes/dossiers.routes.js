const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const ctrl = require('../controllers/dossiers.controller');

router.use(authenticate);

router.get('/stats', requireRole('admin'), ctrl.stats);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', upload.fields([
  { name: 'universityNotice', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'avi', maxCount: 1 },
]), ctrl.create);
router.patch('/:id/assign-host', requireRole('admin'), ctrl.assignHost);
router.patch('/:id/revoke-host', requireRole('admin'), ctrl.revokeHost);
router.patch('/:id/verify-student-docs', requireRole('admin'), ctrl.verifyStudentDocs);
router.patch('/:id/reject-student-docs', requireRole('admin'), ctrl.rejectStudentDocs);
router.patch('/:id/resubmit-student-docs', upload.fields([
  { name: 'universityNotice', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'avi', maxCount: 1 },
]), ctrl.resubmitStudentDocs);
router.patch('/:id/validate-docs', requireRole('admin'), ctrl.validateDocs);
router.patch('/:id/reject-docs', requireRole('admin'), ctrl.rejectDocs);
router.patch('/:id/close', requireRole('admin'), ctrl.close);
router.post('/:id/sign-attestation', requireRole('host'), upload.single('signature'), ctrl.signAttestation);
router.patch('/:id/notes', requireRole('admin'), ctrl.updateNotes);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;
