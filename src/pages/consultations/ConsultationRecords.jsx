import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Spinner, Button, ListGroup } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { getConsultations, getConsultationDocument, deleteConsultationDocument } from '../../services/mockData';

function ConsultationRecords() {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const query = user.role === 'Patient' ? { patientId: user.id } : { doctorId: user.id };
    getConsultations(query).then(data => { setRecords(data || []); setLoading(false); });
  }, [user]);

  const fileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎬';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  const handleDownload = async (consultationId, docId, docName) => {
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
    } catch { alert('Failed to download document.'); }
  };

  const handleDelete = async (consultationId, docId, docName) => {
    if (!window.confirm(`Delete "${docName}"? This cannot be undone.`)) return;
    try {
      await deleteConsultationDocument(consultationId, docId);
      setRecords(prev => prev.map(r =>
        r.id === consultationId
          ? { ...r, documents: r.documents.filter(d => String(d._id) !== String(docId)) }
          : r
      ));
    } catch { alert('Failed to delete document.'); }
  };

  const DocList = ({ record }) => {
    if (!record.documents?.length) return null;
    return (
      <div className="mt-2">
        <strong className="small">Attachments:</strong>
        <ListGroup className="mt-1">
          {record.documents.map(d => (
            <ListGroup.Item key={d._id} className="d-flex justify-content-between align-items-center py-1 px-2 small">
              <span>{fileIcon(d.type)} {d.name}</span>
              <div className="d-flex gap-1">
                <Button variant="outline-primary" size="sm" className="py-0 px-2"
                  onClick={() => handleDownload(record.id, d._id, d.name)}>⬇</Button>
                {user.role === 'Doctor' && (
                  <Button variant="outline-danger" size="sm" className="py-0 px-2"
                    onClick={() => handleDelete(record.id, d._id, d.name)}>🗑</Button>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    );
  };

  if (!user) return <Container className="py-5"><p>Loading...</p></Container>;

  return (
    <Container className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">Consultation Records</h2>
          <p className="text-muted mb-0">
            {user.role === 'Patient' ? 'Your complete medical history and prescriptions.' : 'Historical records of all your patient consultations.'}
          </p>
        </Col>
      </Row>

      <Card className="premium-card shadow-sm border-0">
        <Card.Body className="p-3 p-md-4">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">No consultation records found.</div>
          ) : (
            <>
              {/* ── MOBILE: stacked cards ── */}
              <div className="d-md-none">
                {records.map(record => (
                  <div key={record.id} className="consult-card">
                    <div className="fw-bold text-success mb-1">
                      {record.appointmentDate} <span className="text-muted fw-normal small">{record.appointmentTime}</span>
                    </div>
                    <div className="small mb-1">
                      <strong>{user.role === 'Patient' ? 'Doctor' : 'Patient'}:</strong>{' '}
                      {user.role === 'Patient' ? record.doctorName : record.patientName}
                    </div>
                    <div className="small mb-1"><strong>Notes:</strong> {record.notes}</div>
                    <div className="small mb-1">
                      <strong>Prescription:</strong>{' '}
                      {record.prescription ? <span className="text-primary">{record.prescription}</span> : <em className="text-muted">None</em>}
                    </div>
                    <DocList record={record} />
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: table ── */}
              <div className="d-none d-md-block">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary">
                    <tr>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">{user.role === 'Patient' ? 'Doctor' : 'Patient'}</th>
                      <th className="py-3 px-3">Clinical Notes</th>
                      <th className="py-3 px-3">Prescription</th>
                      <th className="py-3 px-3">Documents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(record => (
                      <tr key={record.id}>
                        <td className="py-3 px-3">
                          <strong>{record.appointmentDate}</strong><br />
                          <small className="text-muted">{record.appointmentTime}</small>
                        </td>
                        <td className="py-3 px-3 fw-medium">{user.role === 'Patient' ? record.doctorName : record.patientName}</td>
                        <td className="py-3 px-3">{record.notes}</td>
                        <td className="py-3 px-3">
                          {record.prescription ? <span className="text-primary">{record.prescription}</span> : <span className="text-muted fst-italic">None</span>}
                        </td>
                        <td className="py-3 px-3">
                          {record.documents?.length ? (
                            <div className="d-flex flex-column gap-1">
                              {record.documents.map(d => (
                                <Button key={d._id} variant="outline-secondary" size="sm" className="text-start py-0 px-2"
                                  onClick={() => handleDownload(record.id, d._id, d.name)}>
                                  {fileIcon(d.type)} {d.name}
                                </Button>
                              ))}
                            </div>
                          ) : <span className="text-muted fst-italic">None</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ConsultationRecords;
