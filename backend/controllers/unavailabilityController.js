const Unavailability = require('../models/Unavailability');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

exports.getUnavailability = async (req, res) => {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.date) filter.date = req.query.date;
    
    const unavailabilities = await Unavailability.find(filter);
    res.json(unavailabilities);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createUnavailability = async (req, res) => {
  try {
    const newUnavailability = new Unavailability(req.body);
    await newUnavailability.save();

    // Auto-cancel logic for affected appointments
    const { doctorId, date, type, startTime, endTime } = req.body;
    
    // Find all Booked appointments for this doctor on this specific date
    const affectedAppointments = await Appointment.find({ doctorId, date, status: 'Booked' });
    
    for (const app of affectedAppointments) {
      // If it's a selective leave, we only cancel if the timeSlot falls between the start and end.
      // To keep things perfectly safe and robust for a "Day Leave", we cancel if it's Full/Half day, 
      // or if it matches the Selective time constraints.
      // For simplicity as requested, we will cancel the overlapping booked appointments.
      let shouldCancel = false;
      
      if (type === 'Full Day') shouldCancel = true;
      else if (type.includes('Morning') && app.timeSlot.includes('AM')) shouldCancel = true;
      else if (type.includes('Afternoon') && app.timeSlot.includes('PM')) shouldCancel = true;
      else if (type === 'Selective') {
        // Very basic matching for exact slots to prevent complexity in the demo
        if (app.timeSlot === startTime || app.timeSlot === endTime) shouldCancel = true;
      } else {
        shouldCancel = true; // Fallback cancel all
      }

      if (shouldCancel) {
        app.status = 'Cancelled';
        await app.save();

        // Automatically notify the patient
        await new Notification({
          id: uuidv4(),
          userId: app.patientId,
          message: `Your appointment on ${app.date} at ${app.timeSlot} has been automatically cancelled because the doctor is unavailable on this day.`,
          type: 'Warning'
        }).save();
      }
    }

    res.status(201).json(newUnavailability);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteUnavailability = async (req, res) => {
  try {
    await Unavailability.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
