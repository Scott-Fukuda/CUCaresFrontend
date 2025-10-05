import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // or however you store login state

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}