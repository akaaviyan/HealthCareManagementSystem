import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { registerUser } from '../../services/mockData';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'Patient'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [doctorCode, setDoctorCode] = useState('');
  const [showDoctorCode, setShowDoctorCode] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long, and include at least 1 letter and 1 symbol.');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.role === 'Doctor' && !doctorCode.trim()) {
      setError('Doctor verification code is required.');
      return;
    }

    try {
      const userData = formData.role === 'Doctor' ? { ...formData, doctorCode } : formData;
      const newUser = await registerUser(userData);
      if (!newUser) {
        setError('Registration failed. Please try again.');
        return;
      }
      dispatch(setUser(newUser));
      navigate(newUser.role === 'Patient' ? '/patient/dashboard' : '/doctor/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="premium-card p-3 p-md-4">
            <Card.Body>
              <h2 className="text-center mb-4 fw-bold">Register</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="tel" name="phone" placeholder="555-0000" value={formData.phone} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>I am a...</Form.Label>
                  <Form.Select name="role" value={formData.role} onChange={handleChange}>
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor</option>
                  </Form.Select>
                </Form.Group>

                {formData.role === 'Doctor' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Doctor Verification Code</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showDoctorCode ? 'text' : 'password'}
                        placeholder="Enter verification code"
                        value={doctorCode}
                        onChange={(e) => setDoctorCode(e.target.value)}
                        required
                      />
                      <Button variant='outline-secondary' onClick={() => setShowDoctorCode(!showDoctorCode)}>
                        {showDoctorCode ? <FaEyeSlash /> : <FaEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control type={showPassword ? "text" : "password"} name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup>
                    <Form.Control type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mb-3 py-2">Create Account</Button>
                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <Link to="/login" className="text-decoration-none">Login here</Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;
