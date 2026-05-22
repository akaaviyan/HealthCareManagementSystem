const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // recipient
  message: { type: String, required: true },
  type: { type: String }, // 'Alert', 'Success', 'Warning'
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
