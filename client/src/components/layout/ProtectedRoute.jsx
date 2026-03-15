import { Navigate }    from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectUser,
}  from "../../store/slices/authSlice";

const ProtectedRoute = ({ children, roles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectUser);

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to dashboard
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;