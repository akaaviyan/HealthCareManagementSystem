import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectUser, selectAuthLoading } from '../../store/authSlice';

const ProtectedRoute = ({ children, allowedRole }) => {
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
