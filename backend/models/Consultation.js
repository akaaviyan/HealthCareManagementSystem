const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },   // MIME type e.g. 'application/pdf', 'image/png', 'video/mp4'
  size: { type: Number },                   // bytes
  data: { type: String, required: true },   // base64-encoded content
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const consultationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  appointmentId: { type: String, ref: 'Appointment', required: true }, // Foreign Key
  notes: { type: String, required: true },
  prescription: { type: String },
  documents: { type: [documentSchema], default: [] },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Consultation', consultationSchema);
