import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Spinner, ListGroup, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { getAppointmentsByUser, getUserById, updateAppointment, createConsultation, getConsultations, getPatientHistory, getConsultationDocument, deleteConsultationDocument } from '../../services/mockData';

function DoctorDashboard() {
  const user = useSelector(selectUser);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedPatientName, setSelectedPatientName] = useState('');

  // Document upload state
  const [pendingFiles, setPendingFiles] = useState([]); // { name, type, size, data (base64) }
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
  const MAX_FILE_MB = 10;

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAppointmentsByUser(user.id, user.role);
    const enriched = await Promise.all(data.map(async app => {
      try {
        const patient = await getUserById(app.patientId);
        let consData = null;
        if (app.status === 'Completed') {
          const c = await getConsultations({ appointmentId: app.id });
          if (c?.length) consData = c[0];
        }
        return { ...app, patientName: patient?.name || 'Unknown', notes: consData?.notes || '', prescription: consData?.prescription || '', consultationId: consData?.id || null, documents: consData?.documents || [] };
      } catch { return { ...app, patientName: 'Unknown', notes: '', prescription: '', consultationId: null, documents: [] }; }
    }));
    setAppointments(enriched.reverse());
    setLoading(false);
  };

  useEffect(() => { loadAppointments(); }, [user]);

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // strip data: prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (e) => {
    setFileError('');
    const files = Array.from(e.target.files);
    const results = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not a supported type. Allowed: PDF, images, videos.`);
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds ${MAX_FILE_MB}MB limit.`);
        continue;
      }
      const data = await readFileAsBase64(file);
      results.push({ name: file.name, type: file.type, size: file.size, data });
    }
    setPendingFiles(prev => [...prev, ...results]);
    e.target.value = '';
  };

  const removeFile = (index) => setPendingFiles(prev => prev.filter((_, i) => i !== index));

  const handleSaveNotes = async () => {
    setUploading(true);
    try {
      await createConsultation({ appointmentId: selectedAppointment.id, notes, prescription, documents: pendingFiles });
      await updateAppointment(selectedAppointment.id, { status: 'Completed' });
      setShowModal(false);
      setPendingFiles([]);
      setFileError('');
      loadAppointments();
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this appointment?')) {
      await updateAppointment(id, { status: 'Cancelled', cancelledBy: user.name });
      loadAppointments();
    }
  };

  const handleViewHistory = async (patientId, patientName) => {
    setSelectedPatientName(patientName);
    const history = await getPatientHistory(patientId);
    setHistoryData(history);
    setShowHistoryModal(true);
  };

  const handleDownloadDoc = async (consultationId, docId, docName) => {
    try {
      const doc = await getConsultationDocument(consultationId, docId);
      const byteChars = atob(doc.data);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: doc.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = docName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download document.');
    }
  };

  const handleDeleteDoc = async (consultationId, docId, docName) => {
    if (!window.confirm(`Delete "${docName}"? This cannot be undone.`)) return;
    try {
      await deleteConsultationDocument(consultationId, docId);
      // Refresh appointments so the doc disappears from the table row
      await loadAppointments();
      // Also refresh history modal data if open
      if (showHistoryModal) {
        setHistoryData(prev => prev.map(r =>
          r.id === consultationId
            ? { ...r, documents: r.documents.filter(d => String(d._id) !== String(docId)) }
            : r
        ));
      }
    } catch {
      alert('Failed to delete document.');
    }
  };

  const fileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const DoctorActions = ({ app }) => (
    <div className="d-flex flex-column gap-2">
      {app.status === 'Booked' ? (
        <div className="d-flex gap-2 flex-wrap">
          <Button size="sm" variant="primary" onClick={() => { setSelectedAppointment(app); setNotes(app.notes || ''); setPrescription(app.prescription || ''); setPendingFiles([]); setFileError(''); setShowModal(true); }}>Add Notes</Button>
          <Button size="sm" variant="outline-danger" onClick={() => handleCancel(app.id)}>Cancel</Button>
        </div>
      ) : app.status === 'Completed' ? (
        <div className="small">
          <strong>Notes:</strong> {app.notes}<br />
          <strong className="text-primary">Rx:</strong> {app.prescription}
          {app.documents?.length > 0 && (
            <div className="mt-1">
              <strong>Docs:</strong>
              <div className="d-flex flex-wrap gap-1 mt-1">
                {app.documents.map(d => (
                  <span key={d._id} className="badge bg-light text-dark border d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => handleDownloadDoc(app.consultationId, d._id, d.name)} title="Download">
                      {fileIcon(d.type)} {d.name}
                    </span>
                    <span
                      style={{ cursor: 'pointer', color: '#dc3545', marginLeft: '4px' }}
                      onClick={() => handleDeleteDoc(app.consultationId, d._id, d.name)}
                      title="Delete">✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="text-muted small">Cancelled by {app.cancelledBy || 'user'}</span>
      )}
      <Button size="sm" variant="outline-secondary" onClick={() => handleViewHistory(app.patientId, app.patientName)}>
        View Medical History
      </Button>
    </div>
  );

  return (
    <Container className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Doctor Dashboard</h2>
          <p className="text-muted mb-0">Welcome, {user?.name}</p>
        </Col>
      </Row>

      <Card className="premium-card mb-4">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="fw-bold">My Appointments</h5>
        </Card.Header>
        <Card.Body className="pt-3">
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <>
              {/* ── MOBILE ── */}
              <div className="d-md-none">
                {appointments.length === 0 ? (
                  <p className="text-center text-muted py-4">No appointments found.</p>
                ) : appointments.map(app => (
                  <div key={app.id} className="appt-card">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <strong>{app.date}</strong>
                        <span className="appt-meta ms-2">{app.timeSlot}</span>
                      </div>
                      <Badge bg={app.status === 'Completed' ? 'success' : app.status === 'Booked' ? 'info' : 'danger'} className="px-2 py-1 rounded-pill">
                        {app.status}
                      </Badge>
                    </div>
                    <div className="small text-primary mb-2"><strong>Patient:</strong> {app.patientName}</div>
                    <DoctorActions app={app} />
                  </div>
                ))}
              </div>

              {/* ── DESKTOP ── */}
              <div className="d-none d-md-block">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>Date</th><th>Time</th><th>Patient</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td><strong>{app.date}</strong></td>
                        <td className="text-muted small">{app.timeSlot}</td>
                        <td>{app.patientName}</td>
                        <td><Badge bg={app.status === 'Completed' ? 'success' : app.status === 'Booked' ? 'info' : 'danger'} className="px-3 py-2 rounded-pill">{app.status}</Badge></td>
                        <td><DoctorActions app={app} /></td>
                      </tr>
                    ))}
                    {appointments.length === 0 && <tr><td colSpan="5" className="text-center py-4">No appointments found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Consultation Notes Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setPendingFiles([]); setFileError(''); }} size="lg">
        <Modal.Header closeButton><Modal.Title>Consultation Record</Modal.Title></Modal.Header>
        <Modal.Body>
          <p><strong>Patient:</strong> {selectedAppointment?.patientName}</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Clinical Notes</Form.Label>
              <Form.Control as="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Diagnosis, symptoms, etc." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prescription</Form.Label>
              <Form.Control as="textarea" rows={2} value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Medication details" />
            </Form.Group>

            {/* Document Upload */}
            <Form.Group className="mb-2">
              <Form.Label>Attach Documents <span className="text-muted fw-normal">(PDF, image, or video — max 10 MB each)</span></Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Button variant="outline-secondary" size="sm" onClick={() => fileInputRef.current?.click()} type="button">
                  📎 Choose Files 
                </Button>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*,video/mp4,video/webm,video/quicktime"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
              {fileError && <Alert variant="danger" className="mt-2 py-1 px-2 small">{fileError}</Alert>}
            </Form.Group>

            {pendingFiles.length > 0 && (
              <ListGroup className="mb-2">
                {pendingFiles.map((f, i) => (
                  <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center py-1 px-3 small">
                    <span>{fileIcon(f.type)} {f.name} <span className="text-muted">({formatBytes(f.size)})</span></span>
                    <Button variant="link" className="text-danger p-0 ms-2" size="sm" onClick={() => removeFile(i)} type="button">✕</Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowModal(false); setPendingFiles([]); setFileError(''); }}>Close</Button>
          <Button variant="primary" onClick={handleSaveNotes} disabled={uploading}>
            {uploading ? <><Spinner size="sm" animation="border" className="me-2" />Saving...</> : 'Complete & Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Medical History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light"><Modal.Title>Medical History: {selectedPatientName}</Modal.Title></Modal.Header>
        <Modal.Body>
          {historyData.length === 0 ? (
            <p className="text-muted text-center py-4">No past medical history found.</p>
          ) : historyData.map(record => (
            <Card key={record.id} className="mb-3 border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-2">{record.appointmentDate} at {record.appointmentTime}</h6>
                <p className="mb-1"><strong>Clinical Notes:</strong> {record.notes}</p>
                {record.prescription && <p className="mb-1"><strong>Prescription:</strong> {record.prescription}</p>}
                {record.documents?.length > 0 && (
                  <div className="mt-2">
                    <strong className="small">Attached Documents:</strong>
                    <ListGroup className="mt-1">
                      {record.documents.map(d => (
                        <ListGroup.Item key={d._id} className="d-flex justify-content-between align-items-center py-1 px-3 small">
                          <span>{fileIcon(d.type)} {d.name} {d.size ? <span className="text-muted">({formatBytes(d.size)})</span> : ''}</span>
                          <div className="d-flex gap-2">
                            <Button variant="outline-primary" size="sm" className="py-0 px-2"
                              onClick={() => handleDownloadDoc(record.id, d._id, d.name)}>
                              ⬇ Download
                            </Button>
                            <Button variant="outline-danger" size="sm" className="py-0 px-2"
                              onClick={() => handleDeleteDoc(record.id, d._id, d.name)}>
                              🗑 Delete
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </Card.Body>
            </Card>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default DoctorDashboard;
