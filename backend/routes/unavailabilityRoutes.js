const express = require('express');
const router = express.Router();
const unavailabilityController = require('../controllers/unavailabilityController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, unavailabilityController.getUnavailability);
router.post('/', requireAuth, unavailabilityController.createUnavailability);
router.delete('/:id', requireAuth, unavailabilityController.deleteUnavailability);

module.exports = router;
