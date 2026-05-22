const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, ref: 'Patient', required: true }, // Foreign Key
  doctorId: { type: String, ref: 'Doctor', required: true }, // Foreign Key
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: { type: String, required: true }, // 'Booked', 'Completed', 'Cancelled'
  notes: { type: String },
  prescription: { type: String },
  cancelledBy: { type: String }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
