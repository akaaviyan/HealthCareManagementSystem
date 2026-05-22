const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, notificationController.getNotifications);
router.post('/', requireAuth, notificationController.createNotification);
router.patch('/:id/read', requireAuth, notificationController.markAsRead);

module.exports = router;
