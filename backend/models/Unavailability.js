const mongoose = require('mongoose');

const unavailabilitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  doctorId: { type: String, ref: 'Doctor', required: true }, // Foreign Key
  date: { type: String, required: true },
  type: { type: String, required: true },
  startTime: { type: String },
  endTime: { type: String }
});

module.exports = mongoose.model('Unavailability', unavailabilitySchema);
