import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setUser, logoutAction } from '../../store/authSlice';
import { updateUser, deleteUser } from '../../services/mockData';
import { FaUserCircle } from 'react-icons/fa';

function Profile() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', age: '', weight: '', bloodType: '', allergies: '',
    specialty: '', experience: '', qualification: '', address: '', emergencyContact: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) setFormData({
      name: user.name || '', age: user.age || '', weight: user.weight || '',
      bloodType: user.bloodType || '', allergies: user.allergies || '',
      specialty: user.specialty || '', experience: user.experience || '',
      qualification: user.qualification || '', address: user.address || '',
      emergencyContact: user.emergencyContact || ''
    });
  }, [user]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const updatedUser = await updateUser(user.id, formData);
    dispatch(setUser(updatedUser));
    sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async () => {
    if (window.confirm('Permanently delete your account? This cannot be undone.')) {
      await deleteUser(user.id);
      dispatch(logoutAction());
      navigate('/');
    }
  };

  if (!user) return <Container className="py-5"><p>Loading profile...</p></Container>;

  return (
    <Container className="dashboard-container">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <Card className="premium-card p-3 p-md-4">
            <Card.Body>
              <div className="profile-header d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                <FaUserCircle size={56} className="text-secondary flex-shrink-0" />
                <div style={{ minWidth: 0 }}>
                  <h3 className="fw-bold mb-0">My Profile</h3>
                  <p className="text-muted mb-0 small text-truncate">ID: <span className="fw-bold text-dark">{user.id}</span></p>
                </div>
              </div>

              {success && <Alert variant="success">Profile updated successfully!</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col xs={12} sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Display Name</Form.Label>
                      <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Role</Form.Label>
                      <Form.Control type="text" value={user.role} disabled className="bg-light" />
                    </Form.Group>
                  </Col>
                </Row>

                <h5 className="mt-3 mb-3 fw-bold border-bottom pb-2">
                  {user.role === 'Patient' ? 'Medical Information' : 'Professional Credentials'}
                </h5>

                {user.role === 'Patient' ? (
                  <>
                    <Row>
                      <Col xs={12} sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Age</Form.Label>
                          <Form.Control type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 34" min="0" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Weight (kg)</Form.Label>
                          <Form.Control type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g. 70" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Blood Type</Form.Label>
                          <Form.Select name="bloodType" value={formData.bloodType} onChange={handleChange}>
                            <option value="">Select...</option>
                            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => <option key={t}>{t}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Allergies</Form.Label>
                      <Form.Control as="textarea" rows={2} name="allergies" value={formData.allergies} onChange={handleChange} placeholder="Any known allergies..." />
                    </Form.Group>
                  </>
                ) : (
                  <>
                    <Row>
                      <Col xs={12} sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Specialty</Form.Label>
                          <Form.Control type="text" name="specialty" value={formData.specialty} onChange={handleChange} placeholder="e.g. Cardiologist" />
                        </Form.Group>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Years of Experience</Form.Label>
                          <Form.Control type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 10" min="0" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Qualifications</Form.Label>
                      <Form.Control type="text" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. MBBS, MD" />
                    </Form.Group>
                  </>
                )}

                <Row>
                  <Col xs={12} sm={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Home Address</Form.Label>
                      <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} placeholder="Full address..." />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Emergency Contact</Form.Label>
                      <Form.Control as="textarea" rows={2} name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="Name & Phone Number..." />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Save Changes</Button>
              </Form>

              <hr className="my-4" />
              <div className="text-center">
                <h6 className="text-danger fw-bold mb-2">Danger Zone</h6>
                <p className="text-muted small">This action is permanent and cannot be undone.</p>
                <Button variant="outline-danger" onClick={handleDelete}>Delete Account</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
