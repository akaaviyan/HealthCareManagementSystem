import { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { addUnavailability } from '../../services/mockData';

const timeOptions = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

function DoctorAvailability() {
  const { user } = useContext(AuthContext);
  const [date, setDate] = useState('');
  const [type, setType] = useState('Full Day');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return;
    
    if (type === 'Selective' && (!startTime || !endTime)) {
      return;
    }

    await addUnavailability({
      doctorId: user.id,
      date,
      type,
      startTime,
      endTime
    });

    setSuccess(`Unavailability/Leave successfully documented for ${date}`);
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <Container className="dashboard-container">
      <Row className="justify-content-center px-2 px-md-0">
        <Col xs={12} md={10} lg={8}>
          <Card className="premium-card p-3 p-md-4">
            <Card.Body>
              <h3 className="fw-bold mb-3">Leave & Unavailability Management</h3>
              <p className="text-muted">
                You are automatically marked as available from 09:00 AM to 05:00 PM standard. 
                Use this form to mark dates where you are on leave or unavailable, and the system 
                will automatically hide those slots from patients. State Holidays are pre-blocked.
              </p>
              
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Select Date</Form.Label>
                  <Form.Control 
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Leave Type</Form.Label>
                  <Form.Select value={type} onChange={e => setType(e.target.value)}>
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day (Morning)">Half Day (Morning: 9 AM - 12 PM)</option>
                    <option value="Half Day (Afternoon)">Half Day (Afternoon: 1 PM - 5 PM)</option>
                    <option value="Selective">Selective Time Range</option>
                  </Form.Select>
                </Form.Group>

                {type === 'Selective' && (
                  <Row className="mb-4">
                    <Col xs={12} md={6} className="mb-3 mb-md-0">
                      <Form.Group>
                        <Form.Label>Unavailability Start Time</Form.Label>
                        <Form.Select value={startTime} onChange={e => setStartTime(e.target.value)} required>
                          <option value="">Select Time...</option>
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label>Unavailability End Time</Form.Label>
                        <Form.Select value={endTime} onChange={e => setEndTime(e.target.value)} required>
                          <option value="">Select Time...</option>
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Button variant="danger" type="submit" className="w-100 py-2 fw-bold">
                  Document Leave
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DoctorAvailability;
