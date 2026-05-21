import { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const user = JSON.parse(localStorage.getItem('authUser'));
      navigate(user.role === 'Patient' ? '/patient/dashboard' : '/doctor/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <Container className="py-4 py-md-5">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={7} lg={5}>
          <Card className="premium-card p-3 p-md-4">
            <Card.Body>
              <h2 className="text-center mb-4 fw-bold">Login</h2>
              {error && <Alert variant="danger">{error}</Alert>}

              {/* Demo autofill — buttons wrap on small screens */}
              <Alert variant="info" className="small">
                <strong>Demo Accounts:</strong>
                <div className="demo-btn-group">
                  <Button size="sm" variant="outline-primary" onClick={() => { setEmail('sarah.jane@hospital.com'); setPassword('password123'); }}>Dr. Sarah</Button>
                  <Button size="sm" variant="outline-primary" onClick={() => { setEmail('john.smith@hospital.com'); setPassword('password123'); }}>Dr. John</Button>
                  <Button size="sm" variant="outline-success" onClick={() => { setEmail('john.doe@test.com'); setPassword('password123'); }}>Patient John</Button>
                  <Button size="sm" variant="outline-success" onClick={() => { setEmail('alice.johnson@test.com'); setPassword('password123'); }}>Patient Alice</Button>
                </div>
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 mb-3 py-2">Sign In</Button>
                <div className="text-center">
                  <span className="text-muted">Don't have an account? </span>
                  <Link to="/register" className="text-decoration-none">Register here</Link>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
