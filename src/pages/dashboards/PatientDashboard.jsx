import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { getAppointmentsByUser, getUserById, updateAppointment, getDoctorAvailability, getConsultations } from '../../services/mockData';
import { Link } from 'react-router-dom';

function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlot, setNewSlot] = useState('');

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAppointmentsByUser(user.id, user.role);
    const enriched = await Promise.all(data.map(async app => {
      try {
        const doc = await getUserById(app.doctorId);
        let consData = null;
        if (app.status === 'Completed') {
          const c = await getConsultations({ appointmentId: app.id });
          if (c?.length) consData = c[0];
        }
        return { ...app, doctorName: doc?.name || 'Unknown Doctor', notes: consData?.notes || '', prescription: consData?.prescription || '' };
      } catch { return { ...app, doctorName: 'Unknown Doctor', notes: '', prescription: '' }; }
    }));
    setAppointments(enriched.reverse());
    setLoading(false);
  };

  useEffect(() => { loadAppointments(); }, [user]);

  useEffect(() => {
    if (showReschedule && selectedApp && newDate) {
      getDoctorAvailability(selectedApp.doctorId, newDate).then(slots => { setAvailableSlots(slots); setNewSlot(''); });
    }
  }, [newDate, showReschedule, selectedApp]);

  const getBadgeVariant = s => ({ Completed: 'completed', Booked: 'booked', Cancelled: 'cancelled' }[s] || 'secondary');

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      await updateAppointment(id, { status: 'Cancelled', cancelledBy: user.name });
      loadAppointments();
    }
  };

  const handleReschedule = (app) => {
    setSelectedApp(app); setNewDate(app.date); setAvailableSlots([]); setNewSlot(''); setShowReschedule(true);
  };

  const submitReschedule = async () => {
    if (newDate && newSlot) {
      await updateAppointment(selectedApp.id, { date: newDate, timeSlot: newSlot });
      setShowReschedule(false);
      loadAppointments();
    }
  };

  const ActionButtons = ({ app }) => app.status === 'Booked' ? (
    <div className="d-flex gap-2 flex-wrap">
      <Button variant="outline-primary" size="sm" onClick={() => handleReschedule(app)}>Reschedule</Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleCancel(app.id)}>Cancel</Button>
    </div>
  ) : app.notes ? (
    <div className="small">
      <strong>Notes:</strong> {app.notes}<br />
      {app.prescription && <><strong className="text-primary">Rx:</strong> {app.prescription}</>}
    </div>
  ) : (
    <span className="text-muted small">{app.status === 'Cancelled' ? `Cancelled by ${app.cancelledBy || 'user'}` : 'No notes yet.'}</span>
  );

  return (
    <Container className="dashboard-container">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col xs={12} md>
          <h2 className="fw-bold mb-0">My Dashboard</h2>
          <p className="text-muted mb-0">Welcome, {user?.name}</p>
        </Col>
        <Col xs={12} md="auto" className="mt-3 mt-md-0">
          <Link to="/patient/book-appointment">
            <Button variant="primary" className="w-100">+ Book Appointment</Button>
          </Link>
        </Col>
      </Row>

      <Card className="premium-card">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="fw-bold">Appointments</h5>
        </Card.Header>
        <Card.Body className="pt-3">
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : appointments.length === 0 ? (
            <p className="text-muted text-center py-4">No appointments yet. Book one today!</p>
          ) : (
            <>
              {/* ── MOBILE: card list ── */}
              <div className="d-md-none">
                {appointments.map(app => (
                  <div key={app.id} className="appt-card">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <strong>{app.date}</strong>
                        <span className="appt-meta ms-2">{app.timeSlot}</span>
                      </div>
                      <Badge className={`badge-${getBadgeVariant(app.status)} px-2 py-1 rounded-pill`}>
                        {app.status}
                      </Badge>
                    </div>
                    <div className="small text-primary mb-2"><strong>Dr.</strong> {app.doctorName}</div>
                    <ActionButtons app={app} />
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: table ── */}
              <div className="d-none d-md-block">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th><th>Time</th><th>Doctor</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td><strong>{app.date}</strong></td>
                        <td className="text-muted small">{app.timeSlot}</td>
                        <td>{app.doctorName}</td>
                        <td><Badge className={`badge-${getBadgeVariant(app.status)} px-3 py-2 rounded-pill`}>{app.status}</Badge></td>
                        <td><ActionButtons app={app} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Reschedule Modal */}
      <Modal show={showReschedule} onHide={() => setShowReschedule(false)}>
        <Modal.Header closeButton><Modal.Title>Reschedule Appointment</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedApp && (
            <Form>
              <p>Rescheduling with <strong>{selectedApp.doctorName}</strong></p>
              <Form.Group className="mb-3">
                <Form.Label>New Date</Form.Label>
                <Form.Control type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </Form.Group>
              {newDate && availableSlots.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>New Time Slot</Form.Label>
                  <div className="slot-grid mt-2">
                    {availableSlots.map(slot => (
                      <Button key={slot} type="button" variant={newSlot === slot ? 'primary' : 'outline-primary'} onClick={() => setNewSlot(slot)}>{slot}</Button>
                    ))}
                  </div>
                </Form.Group>
              )}
              {newDate && availableSlots.length === 0 && <p className="text-danger small">No slots on this date.</p>}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReschedule(false)}>Close</Button>
          <Button variant="primary" onClick={submitReschedule} disabled={!newDate || !newSlot}>Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default PatientDashboard;
