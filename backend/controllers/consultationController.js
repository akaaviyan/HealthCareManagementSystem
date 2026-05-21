const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { v4: uuidv4 } = require('uuid');

exports.getConsultations = async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId } = req.query;

    if (appointmentId) {
      const consultations = await Consultation.find({ appointmentId });
      return res.json(consultations);
    }

    if (patientId || doctorId) {
      const appFilter = { status: 'Completed' };
      if (patientId) appFilter.patientId = patientId;
      if (doctorId) appFilter.doctorId = doctorId;

      const appointments = await Appointment.find(appFilter);
      const appIds = appointments.map(a => a.id);

      const consultations = await Consultation.find({ appointmentId: { $in: appIds } }).sort({ date: -1 });

      // Fetch all required user details to enrich the response
      const history = await Promise.all(consultations.map(async cons => {
        const app = appointments.find(a => a.id === cons.appointmentId);
        
        let doctorName = 'Unknown', patientName = 'Unknown';
        if (app) {
          const doc = await Doctor.findOne({ id: app.doctorId });
          const pat = await Patient.findOne({ id: app.patientId });
          if (doc) doctorName = doc.name;
          if (pat) patientName = pat.name;
        }

        const obj = cons.toObject();
        // Strip base64 data from list view; clients fetch individual docs when needed
        const docsMeta = (obj.documents || []).map(d => ({ _id: d._id, name: d.name, type: d.type, size: d.size, uploadedAt: d.uploadedAt }));

        return {
          ...obj,
          documents: docsMeta,
          appointmentDate: app ? app.date : 'Unknown Date',
          appointmentTime: app ? app.timeSlot : '',
          doctorName,
          patientName
        };
      }));

      return res.json(history);
    }

    const consultations = await Consultation.find();
    res.json(consultations);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createConsultation = async (req, res) => {
  try {
    // documents is an array of { name, type, size, data } passed from the frontend
    const { documents = [], ...rest } = req.body;
    const newConsultation = new Consultation({ ...rest, documents, id: uuidv4() });
    await newConsultation.save();
    // Return without raw base64 data to keep response lean
    const lean = newConsultation.toObject();
    lean.documents = lean.documents.map(d => ({ _id: d._id, name: d.name, type: d.type, size: d.size, uploadedAt: d.uploadedAt }));
    res.status(201).json(lean);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Return metadata list for documents of a consultation (no base64 data)
exports.getDocumentsList = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ id: req.params.consultationId });
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    const meta = consultation.documents.map(d => ({
      _id: d._id,
      name: d.name,
      type: d.type,
      size: d.size,
      uploadedAt: d.uploadedAt
    }));
    res.json(meta);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Return single document with base64 data (for download/preview)
exports.getDocument = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ id: req.params.consultationId });
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    const doc = consultation.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Delete a single document from a consultation
exports.deleteDocument = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({ id: req.params.consultationId });
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    const doc = consultation.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    doc.deleteOne(); // Mongoose subdocument remove
    await consultation.save();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.patientId, status: 'Completed' });
    const appointmentIds = appointments.map(app => app.id);
    
    const consultations = await Consultation.find({ appointmentId: { $in: appointmentIds } }).sort({ date: -1 });
    
    // Combine consultation with appointment date for easy rendering
    const history = consultations.map(cons => {
      const app = appointments.find(a => a.id === cons.appointmentId);
      const obj = cons.toObject();
      const docsMeta = (obj.documents || []).map(d => ({ _id: d._id, name: d.name, type: d.type, size: d.size, uploadedAt: d.uploadedAt }));
      return {
        ...obj,
        documents: docsMeta,
        appointmentDate: app ? app.date : 'Unknown Date',
        appointmentTime: app ? app.timeSlot : '',
        doctorId: app ? app.doctorId : 'Unknown'
      };
    });

    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
