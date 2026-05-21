const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, consultationController.getConsultations);
router.post('/', requireAuth, consultationController.createConsultation);
router.get('/history/:patientId', requireAuth, consultationController.getPatientHistory);

// Document sub-routes
router.get('/:consultationId/documents', requireAuth, consultationController.getDocumentsList);
router.get('/:consultationId/documents/:docId', requireAuth, consultationController.getDocument);
router.delete('/:consultationId/documents/:docId', requireAuth, consultationController.deleteDocument);

module.exports = router;
