const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check Patient first
    let user = await Patient.findOne({ email });
    let model = 'Patient';
    
    // If not Patient, check Doctor
    if (!user) {
      user = await Doctor.findOne({ email });
      model = 'Doctor';
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user.id, user.role);
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ user: userObj, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const role = req.query.role;
    let users = [];
    if (role === 'Doctor') {
      users = await Doctor.find().select('-password');
    } else if (role === 'Patient') {
      users = await Patient.find().select('-password');
    } else {
      const docs = await Doctor.find().select('-password');
      const pats = await Patient.find().select('-password');
      users = [...docs, ...pats];
    }
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    let user = await Patient.findOne({ id: req.params.id }).select('-password');
    if (!user) {
      user = await Doctor.findOne({ id: req.params.id }).select('-password');
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createUser = async (req, res) => {
  try {
    // Verify doctor registration code before allowing doctor accounts to be created
    if (req.body.role === 'Doctor') {
      const validCode = process.env.DOCTOR_REGISTRATION_CODE || 'DOC-2026';
      if (!req.body.doctorCode || req.body.doctorCode !== validCode) {
        return res.status(403).json({ error: 'Invalid doctor verification code. Please contact the hospital admin.' });
      }
    }

    let newUser;
    if (req.body.role === 'Doctor') {
      const { doctorCode, ...rest } = req.body; // strip the code before saving
      newUser = new Doctor(rest);
    } else {
      newUser = new Patient(req.body);
    }
    await newUser.save();

    // Generate JWT token exactly like login does, so the frontend
    // can authenticate all subsequent API calls right after registration.
    const token = generateToken(newUser.id, newUser.role);
    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({ user: userObj, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    // Check which collection to update by finding them first, or just try both
    let updatedUser = await Patient.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).select('-password');
    if (!updatedUser) {
      updatedUser = await Doctor.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).select('-password');
    }
    res.json(updatedUser);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    let deleted = await Patient.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      await Doctor.findOneAndDelete({ id: req.params.id });
    }
    
    await Appointment.deleteMany({ patientId: req.params.id });
    await Appointment.deleteMany({ doctorId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
