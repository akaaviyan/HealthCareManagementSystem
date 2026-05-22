import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { getAllDoctors, getDoctorAvailability, bookAppointment } from '../../services/mockData';

function BookAppointment() {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [success, setSuccess] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    getAllDoctors().then(docs => { setDoctors(docs); setLoadingDocs(false); });
  }, []);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      setLoadingSlots(true);
      getDoctorAvailability(selectedDoctorId, selectedDate).then(slots => {
        setAvailableSlots(slots);
        setSelectedSlot('');
        setLoadingSlots(false);
      });
    }
  }, [selectedDoctorId, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate || !selectedSlot) return;
    await bookAppointment({ patientId: user.id, doctorId: selectedDoctorId, date: selectedDate, timeSlot: selectedSlot });
    setSuccess(true);
    setTimeout(() => navigate('/patient/dashboard'), 2000);
  };

  return (
    <Container className="dashboard-container">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <Card className="premium-card p-3 p-md-4">
            <Card.Body>
              <h3 className="fw-bold mb-4">Book an Appointment</h3>
              {success && <Alert variant="success">Appointment Booked! Redirecting...</Alert>}

              {loadingDocs ? (
                <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">1. Select Doctor</Form.Label>
                    <Form.Select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} required>
                      <option value="">Choose a doctor...</option>
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {selectedDoctorId && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">2. Select Date</Form.Label>
                      <div style={{ overflow: 'hidden', borderRadius: 6 }}>
                        <Form.Control
                          type="date"
                          value={selectedDate}
                          onChange={e => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </Form.Group>
                  )}

                  {loadingSlots && (
                    <div className="mb-4 text-primary small">
                      <Spinner animation="grow" size="sm" /> Loading available times...
                    </div>
                  )}

                  {selectedDate && !loadingSlots && availableSlots.length > 0 && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">3. Select Time</Form.Label>
                      <div className="slot-grid mt-2">
                        {availableSlots.map(slot => (
                          <Button
                            key={slot}
                            type="button"
                            variant={selectedSlot === slot ? 'primary' : 'outline-primary'}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </Form.Group>
                  )}

                  {selectedDate && !loadingSlots && availableSlots.length === 0 && (
                    <Alert variant="warning">No available slots for this date.</Alert>
                  )}

                  <Button
                    variant="primary" size="lg" type="submit" className="w-100 mt-2"
                    disabled={!selectedDoctorId || !selectedDate || !selectedSlot}
                  >
                    Confirm Booking
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default BookAppointment;
