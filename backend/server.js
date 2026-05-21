require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Consultation = require('./models/Consultation');
const Unavailability = require('./models/Unavailability');
const bcrypt = require('bcryptjs');

const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(cors());
// Increase payload limit to handle base64-encoded file uploads (PDFs, images, videos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Local MongoDB');
  } catch (err) {
    console.log('Local MongoDB Service unavailable. Booting In-Memory MongoDB Server as fallback...');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to In-Memory MongoDB natively!');
  }

  // Initial Seeding Logic
  const usersCount = (await Patient.countDocuments()) + (await Doctor.countDocuments());
  if (usersCount === 0) {
      console.log('Seeding database from mockStaticData.json...');
      const staticData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/services/mockStaticData.json'), 'utf8'));
      // Use .save() to trigger bcrypt hooks
      for (const u of staticData.users) {
        if (u.role === 'Doctor') await new Doctor(u).save();
        else await new Patient(u).save();
      }
      await Appointment.insertMany(staticData.appointments);
      if (staticData.consultations) {
        await Consultation.insertMany(staticData.consultations);
      }
      await Unavailability.insertMany(staticData.unavailability);
      console.log('Database seeded successfully!');
  }
}

connectDB();

// --- MVC ROUTES ---
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/unavailability', require('./routes/unavailabilityRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
