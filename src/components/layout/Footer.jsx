import { Container, Row, Col } from 'react-bootstrap';
import { FaHeartbeat, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <Container>
        <Row className="align-items-start">

          {/* ── LEFT: About ── */}
          <Col xs={12} md={4}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaHeartbeat size={20} color="#4da6ff" />
              <span className="footer-brand">HealthCare App</span>
            </div>
            <p className="footer-about">
              A modern platform connecting patients with verified doctors.
              Book appointments, manage your health records, and stay on top
              of your wellbeing — all in one secure place.
            </p>
            <p className="footer-about">
              Our mission is to make quality healthcare accessible and
              organised for everyone, from anywhere, at any time.
            </p>
          </Col>

          {/* ── MIDDLE: empty space ── */}
          <Col xs={12} md={4} />

          {/* ── RIGHT: Contact Us ── */}
          <Col xs={12} md={4}>
            <h6 className="footer-heading">Contact Us</h6>
            <ul className="footer-contact-list">
              <li>
                <FaMapMarkerAlt size={13} className="footer-icon" />
                <span>123 Health Street, Medical District,<br />Chennai, Tamil Nadu 600001</span>
              </li>
              <li>
                <FaPhone size={13} className="footer-icon" />
                <span>+91 98765 43210</span>
              </li>
              <li>
                <FaEnvelope size={13} className="footer-icon" />
                <span>support@healthcareapp.in</span>
              </li>
            </ul>

            <div className="footer-emergency mt-3">
              🚨 <strong>Emergency?</strong> Call <strong>108</strong> (Ambulance) or <strong>104</strong> (Health Helpline)
            </div>
          </Col>
        </Row>

        {/* ── Bottom bar ── */}
        <hr className="footer-divider" />
        <p className="footer-bottom text-center mb-0">
          © {year} HealthCare App. All rights reserved. &nbsp;|&nbsp;
          <span className="footer-disclaimer">
            This platform is for appointment management only and does not provide medical advice.
          </span>
        </p>
      </Container>
    </footer>
  );
}

export default Footer;
