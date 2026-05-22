const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, appointmentController.getAppointments);
router.post('/', requireAuth, appointmentController.createAppointment);
router.patch('/:id', requireAuth, appointmentController.updateAppointment);

module.exports = router;
