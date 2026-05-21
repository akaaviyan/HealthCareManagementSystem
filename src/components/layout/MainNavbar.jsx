import { useState, useEffect, useContext } from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaHeartbeat, FaUserCircle, FaBell } from 'react-icons/fa';
import { getNotifications, markNotificationRead } from '../../services/mockData';

function MainNavbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Controls hamburger open/closed — must be here, not inside Bootstrap
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // ── Auto-close navbar on every route change (mobile link tap) ──
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        const notifs = await getNotifications(user.id);
        setNotifications(notifs || []);
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => { logout(); navigate('/'); };

  const handleRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Close helper — called on every Nav.Link click
  const close = () => setExpanded(false);

  return (
    <Navbar
      bg="white"
      expand="lg"
      className="navbar-custom sticky-top"
      expanded={expanded}          // controlled state
      onToggle={setExpanded}       // syncs toggle button
    >
      <Container>

        {/* Brand */}
        <Navbar.Brand as={Link}
          to={user ? (user.role === 'Patient' ? '/patient/dashboard' : '/doctor/dashboard') : '/'}
          onClick={close}>
          <FaHeartbeat className="me-2 text-primary" />
          HealthCare App
        </Navbar.Brand>

        {/* Mobile: bell + avatar always visible outside collapse */}
        {user && (
          <div className="d-flex align-items-center gap-2 ms-auto me-2 d-lg-none">
            <Dropdown align="end">
              <Dropdown.Toggle as="div" role="button" className="position-relative" style={{ cursor: 'pointer' }}>
                <FaBell size={20} className="text-secondary" />
                {unreadCount > 0 && (
                  <Badge bg="danger" pill
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.6rem' }}>
                    {unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 mt-2 p-0"
                style={{ minWidth: '260px', maxWidth: '90vw', maxHeight: '340px', overflowY: 'auto' }}>
                <div className="p-3 bg-light border-bottom fw-bold small">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-3 text-muted text-center small">No notifications</div>
                ) : notifications.map(n => (
                  <Dropdown.Item key={n.id} onClick={() => handleRead(n.id)}
                    className={`text-wrap border-bottom p-3 ${!n.read ? 'bg-light' : ''}`}
                    style={{ fontSize: '0.82rem' }}>
                    <div className={`fw-bold ${n.type === 'Warning' ? 'text-danger' : 'text-primary'}`}>
                      {n.type || 'Alert'}
                    </div>
                    <div>{n.message}</div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown align="end">
              <Dropdown.Toggle as="div" role="button" style={{ cursor: 'pointer' }}>
                <FaUserCircle size={26} className="text-secondary" />
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow border-0 mt-2">
                <div className="px-3 py-2 text-muted small border-bottom fw-bold">{user.name}</div>
                <Dropdown.Item as={Link} to="/profile" onClick={close}>My Profile</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )}

        {/* Hamburger */}
        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">

            {/* Patient links — each has onClick={close} */}
            {user?.role === 'Patient' && (
              <>
                <Nav.Link as={Link} to="/patient/dashboard" onClick={close}>
                  My Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/consultations" onClick={close}>
                  Consultation Records
                </Nav.Link>
                <Nav.Link as={Link} to="/patient/book-appointment" onClick={close}>
                  Book Appointment
                </Nav.Link>
              </>
            )}

            {/* Doctor links */}
            {user?.role === 'Doctor' && (
              <>
                <Nav.Link as={Link} to="/doctor/dashboard" onClick={close}>
                  My Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/doctor/availability" onClick={close}>
                  Manage Availability
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Desktop: bell + avatar inside collapse */}
          <Nav className="d-none d-lg-flex align-items-center">
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <Dropdown align="end">
                  <Dropdown.Toggle as="div" role="button" className="position-relative" style={{ cursor: 'pointer' }}>
                    <FaBell size={22} className="text-secondary" />
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.65rem' }}>
                        {unreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow border-0 mt-2 p-0"
                    style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="p-3 bg-light border-bottom fw-bold">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-3 text-muted text-center small">No notifications</div>
                    ) : notifications.map(n => (
                      <Dropdown.Item key={n.id} onClick={() => handleRead(n.id)}
                        className={`text-wrap border-bottom p-3 ${!n.read ? 'bg-light' : ''}`}
                        style={{ fontSize: '0.85rem' }}>
                        <div className={`fw-bold ${n.type === 'Warning' ? 'text-danger' : 'text-primary'}`}>
                          {n.type || 'Alert'}
                        </div>
                        <div>{n.message}</div>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown align="end">
                  <Dropdown.Toggle as="div" role="button" className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                    <FaUserCircle size={28} className="text-secondary" />
                    <span className="fw-medium">{user.name}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="shadow border-0 mt-2">
                    <Dropdown.Item as={Link} to="/profile">My Profile</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={close}>Login</Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={close}>
                  <Button variant="primary" size="sm">Register</Button>
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Mobile: login/register when not logged in */}
          {!user && (
            <Nav className="d-lg-none mt-2">
              <Nav.Link as={Link} to="/login" onClick={close}>Login</Nav.Link>
              <Nav.Link as={Link} to="/register" onClick={close}>
                <Button variant="primary" size="sm" className="w-100">Register</Button>
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MainNavbar;
