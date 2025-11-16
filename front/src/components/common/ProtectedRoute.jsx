import { Navigate } from 'react-router-dom';
import { useAuthContext } from './AuthContext';

const ProtectedRoute = ({ children }) => {

  const { isAuthenticated, isLoading } = useAuthContext();
  
 if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;;
};

export default ProtectedRoute;