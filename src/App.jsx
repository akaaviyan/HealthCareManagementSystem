import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { initAuth } from './store/authSlice';
import MainNavbar from './components/layout/MainNavbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient Pages
import PatientDashboard from './pages/dashboards/PatientDashboard';
import BookAppointment from './pages/appointments/BookAppointment';

// Doctor Pages
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import DoctorAvailability from './pages/appointments/DoctorAvailability';

// Shared Pages
import Profile from './pages/profile/Profile';
import ConsultationRecords from './pages/consultations/ConsultationRecords';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  return (
    <>
      <MainNavbar />

      {/* flex:1 so footer always stays at bottom */}
      <main className="page-content">
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Routes */}
          <Route path="/patient/dashboard"
            element={<ProtectedRoute allowedRole="Patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/book-appointment"
            element={<ProtectedRoute allowedRole="Patient"><BookAppointment /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard"
            element={<ProtectedRoute allowedRole="Doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/availability"
            element={<ProtectedRoute allowedRole="Doctor"><DoctorAvailability /></ProtectedRoute>} />

          {/* Shared Protected Routes */}
          <Route path="/consultations"
            element={<ProtectedRoute><ConsultationRecords /></ProtectedRoute>} />
          <Route path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
