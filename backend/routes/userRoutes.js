const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', userController.login);
router.post('/', userController.createUser);
router.get('/', requireAuth, userController.getUsers);
router.get('/:id', requireAuth, userController.getUserById);
router.patch('/:id', requireAuth, userController.updateUser);
router.delete('/:id', requireAuth, userController.deleteUser);

module.exports = router;
