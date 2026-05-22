import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API = 'http://localhost:5000/api';

// --- Axios Interceptor for JWT ---
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Auth Services ---

export const getAuthUser = () => {
  const user = sessionStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API}/users/login`, { email, password });
    const { user, token } = response.data;
    sessionStorage.setItem('authUser', JSON.stringify(user));
    sessionStorage.setItem('jwtToken', token);
    return user;
  } catch (err) {
    return null;
  }
};

export const logoutUser = () => {
  sessionStorage.removeItem('authUser');
  sessionStorage.removeItem('jwtToken');
};

export const registerUser = async (userData) => {
  try {
    const newUser = { id: uuidv4(), ...userData };
    const response = await axios.post(`${API}/users`, newUser);
    const { user, token } = response.data;
    sessionStorage.setItem('authUser', JSON.stringify(user));
    sessionStorage.setItem('jwtToken', token);
    return user;
  } catch (err) {
    // Surface backend error message (e.g. invalid doctor code) to the caller
    const msg = err.response?.data?.error || 'Registration failed.';
    throw new Error(msg);
  }
};

export const getAllDoctors = async () => {
  const response = await axios.get(`${API}/users?role=Doctor`);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await axios.get(`${API}/users/${id}`);
  return response.data;
};

export const updateUser = async (userId, updatedData) => {
  const response = await axios.patch(`${API}/users/${userId}`, updatedData);
  const updatedUser = response.data;
  
  const authUser = getAuthUser();
  if (authUser && authUser.id === userId) {
     sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
  }
  return updatedUser;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API}/users/${userId}`);
  return response.data;
};

// --- Appointments ---

export const getAppointmentsByUser = async (userId, role) => {
  const query = role === 'Patient' ? `patientId=${userId}` : `doctorId=${userId}`;
  const response = await axios.get(`${API}/appointments?${query}`);
  return response.data;
};

export const bookAppointment = async (appointmentData) => {
  const newAppointment = { id: uuidv4(), status: 'Booked', notes: '', prescription: '', ...appointmentData };
  const response = await axios.post(`${API}/appointments`, newAppointment);
  return response.data;
};

export const updateAppointment = async (appointmentId, updateData) => {
  const response = await axios.patch(`${API}/appointments/${appointmentId}`, updateData);
  return response.data;
};

// --- Availability & Leaves ---

const tnHolidays = [
  '2024-01-15', '2024-04-14', '2024-05-01', '2024-08-15', '2024-10-02', '2024-10-31',
  '2025-01-14', '2025-04-14', '2025-05-01', '2025-08-15', '2025-10-02', '2025-10-20',
  '2026-01-14', '2026-04-14', '2026-05-01', '2026-08-15', '2026-10-02', '2026-11-08'
];

const STANDARD_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export const getDoctorAvailability = async (doctorId, date) => {
  if (tnHolidays.includes(date)) return [];

  let timeSlots = [...STANDARD_SLOTS];

  const unavailResponse = await axios.get(`${API}/unavailability?doctorId=${doctorId}&date=${date}`);
  const leave = unavailResponse.data[0];

  if (leave) {
    if (leave.type === 'Full Day') return [];
    if (leave.type === 'Half Day (Morning)') {
      timeSlots = timeSlots.filter(s => s.includes('PM') && s !== '12:00 PM'); 
    }
    if (leave.type === 'Half Day (Afternoon)') {
      timeSlots = timeSlots.filter(s => s.includes('AM') || s === '12:00 PM');
    }
    if (leave.type === 'Selective') {
      const startIndex = timeSlots.indexOf(leave.startTime);
      const endIndex = timeSlots.indexOf(leave.endTime);
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        timeSlots.splice(startIndex, endIndex - startIndex + 1);
      }
    }
  }
  
  const today = new Date();
  const currentIsoDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  
  if (date === currentIsoDate) {
    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();

    timeSlots = timeSlots.filter(slot => {
      const [timeStr, ampm] = slot.split(' ');
      let [hourStr, minStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      let min = parseInt(minStr, 10);
      
      if (ampm === 'PM' && hour !== 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      if (hour < currentHour) return false;
      if (hour === currentHour && min <= currentMinutes) return false;

      return true;
    });
  }

  const appointmentsResponse = await axios.get(`${API}/appointments?doctorId=${doctorId}&date=${date}`);
  const bookedSlots = appointmentsResponse.data
    .filter(a => a.status === 'Booked' || a.status === 'Completed')
    .map(a => a.timeSlot);

  return timeSlots.filter(slot => !bookedSlots.includes(slot));
};

export const addUnavailability = async (unavailabilityData) => {
  const existing = await axios.get(`${API}/unavailability?doctorId=${unavailabilityData.doctorId}&date=${unavailabilityData.date}`);
  if (existing.data.length > 0) {
    await axios.delete(`${API}/unavailability/${existing.data[0].id}`);
  }

  const response = await axios.post(`${API}/unavailability`, { id: uuidv4(), ...unavailabilityData });
  return response.data;
};

// --- Consultations ---

export const getConsultations = async ({ appointmentId, patientId, doctorId } = {}) => {
  let query = '';
  if (appointmentId) query = `appointmentId=${appointmentId}`;
  else if (patientId) query = `patientId=${patientId}`;
  else if (doctorId) query = `doctorId=${doctorId}`;
  
  const response = await axios.get(`${API}/consultations?${query}`);
  return response.data;
};

export const createConsultation = async (consultationData) => {
  const response = await axios.post(`${API}/consultations`, consultationData);
  return response.data;
};

// Fetch document metadata list for a consultation (no base64)
export const getConsultationDocuments = async (consultationId) => {
  const response = await axios.get(`${API}/consultations/${consultationId}/documents`);
  return response.data;
};

// Fetch a single document with its base64 data (for preview/download)
export const getConsultationDocument = async (consultationId, docId) => {
  const response = await axios.get(`${API}/consultations/${consultationId}/documents/${docId}`);
  return response.data;
};

// Delete a document from a saved consultation
export const deleteConsultationDocument = async (consultationId, docId) => {
  const response = await axios.delete(`${API}/consultations/${consultationId}/documents/${docId}`);
  return response.data;
};

export const getPatientHistory = async (patientId) => {
  const response = await axios.get(`${API}/consultations/history/${patientId}`);
  return response.data;
};

// --- Notifications ---

export const getNotifications = async (userId) => {
  const response = await axios.get(`${API}/notifications?userId=${userId}`);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await axios.patch(`${API}/notifications/${notificationId}/read`);
  return response.data;
};
