const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom PK
  name: { type: String, required: true },
  role: { type: String, default: 'Patient' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: String },
  weight: { type: String },
  bloodType: { type: String },
  allergies: { type: String },
  address: { type: String },
  emergencyContact: { type: String }
});

patientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

module.exports = mongoose.model('Patient', patientSchema);
