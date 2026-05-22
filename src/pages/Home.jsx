import { useSelector } from 'react-redux';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link, Navigate } from 'react-router-dom';
import { FaUserMd, FaCalendarCheck, FaNotesMedical } from 'react-icons/fa';

function Home() {
  const user = useSelector(state => state.auth.user);
  if (user) return <Navigate to={user.role === 'Patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;

  return (
    <Container className="py-4 py-md-5">
      <Row className="text-center mb-5">
        <Col>
          <h1 className="display-5 fw-bold text-primary mb-3">Modern Healthcare, Simplified.</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '580px' }}>
            Book appointments, manage records, and organise your schedule — all in one platform for patients and doctors.
          </p>
          {/* hero-cta class stacks buttons on very small screens */}
          <div className="hero-cta mt-4 d-flex flex-wrap justify-content-center gap-3">
            <Link to="/register">
              <Button size="lg" variant="primary" className="px-4 shadow-sm">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline-primary" className="px-4">Login Now</Button>
            </Link>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {[
          { icon: <FaUserMd size={40} />, title: 'Find the Best Doctors', text: 'Browse our directory of verified professionals and find the right doctor for your needs.' },
          { icon: <FaCalendarCheck size={40} />, title: 'Easy Scheduling', text: 'Book, reschedule, or cancel time slots seamlessly from your dashboard.' },
          { icon: <FaNotesMedical size={40} />, title: 'Medical Records', text: 'Keep consultation notes and prescriptions safely stored for future reference.' },
        ].map(({ icon, title, text }) => (
          <Col key={title} xs={12} md={4}>
            <Card className="premium-card h-100 text-center p-4">
              <Card.Body>
                <div className="text-primary mb-3">{icon}</div>
                <Card.Title className="fw-bold">{title}</Card.Title>
                <Card.Text className="text-muted">{text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Home;
