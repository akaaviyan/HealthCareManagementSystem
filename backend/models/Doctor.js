const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom PK
  name: { type: String, required: true },
  role: { type: String, default: 'Doctor' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  specialty: { type: String },
  experience: { type: String },
  qualification: { type: String },
  address: { type: String }, // Clinic address
  emergencyContact: { type: String }
});

doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

module.exports = mongoose.model('Doctor', doctorSchema);
