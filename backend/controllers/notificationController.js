const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.query.userId }).sort({ date: -1 });
    res.json(notifications);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createNotification = async (req, res) => {
  try {
    const newNotification = new Notification({ ...req.body, id: uuidv4() });
    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ id: req.params.id }, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
