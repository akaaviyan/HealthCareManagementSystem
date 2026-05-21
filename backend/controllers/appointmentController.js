const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

exports.getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.patientId) filter.patientId = req.query.patientId;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.date) filter.date = req.query.date;

    const appointments = await Appointment.find(filter);
    res.json(appointments);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;

    // Strict Double-Booking Validation (Backend layer protection)
    const existing = await Appointment.findOne({ 
      doctorId, 
      date, 
      timeSlot, 
      status: { $in: ['Booked', 'Completed'] } 
    });

    if (existing) {
      return res.status(400).json({ error: 'Time slot is already booked by another patient.' });
    }

    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    
    // Create Notification for Doctor
    const notif = new Notification({
      id: uuidv4(),
      userId: doctorId,
      message: `New appointment booked on ${date} at ${timeSlot}`,
      type: 'Success'
    });
    await notif.save();

    res.status(201).json(newAppointment);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateAppointment = async (req, res) => {
  try {
    const existing = await Appointment.findOne({ id: req.params.id });
    const updatedAppointment = await Appointment.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    
    // Notify on Cancelled
    if (req.body.status === 'Cancelled') {
      const recipientId = updatedAppointment.patientId;
      await new Notification({
        id: uuidv4(),
        userId: recipientId,
        message: `Your appointment on ${updatedAppointment.date} at ${updatedAppointment.timeSlot} was cancelled.`,
        type: 'Warning'
      }).save();
    }

    // Notify on Reschedule — date or timeSlot changed without a status change
    const isReschedule = !req.body.status && existing && (
      (req.body.date && req.body.date !== existing.date) ||
      (req.body.timeSlot && req.body.timeSlot !== existing.timeSlot)
    );
    if (isReschedule) {
      const newDate = req.body.date || existing.date;
      const newSlot = req.body.timeSlot || existing.timeSlot;
      // Notify patient
      await new Notification({
        id: uuidv4(),
        userId: updatedAppointment.patientId,
        message: `Your appointment has been rescheduled to ${newDate} at ${newSlot}.`,
        type: 'Alert'
      }).save();
      // Notify doctor
      await new Notification({
        id: uuidv4(),
        userId: updatedAppointment.doctorId,
        message: `An appointment was rescheduled to ${newDate} at ${newSlot}.`,
        type: 'Alert'
      }).save();
    }
    
    res.json(updatedAppointment);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
