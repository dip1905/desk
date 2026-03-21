import { useSelector } from "react-redux";
import {
  selectUser,
  selectToken,
  selectIsAuthenticated,
} from "../store/slices/authSlice";

// Convenience hook to access auth state anywhere
const useAuth = () => {
  const user            = useSelector(selectUser);
  const token           = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const hasRole = (...roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => {
    return ["SUPER_ADMIN", "ADMIN"].includes(user?.role);
  };

  const isManager = () => {
    return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(user?.role);
  };

  return {
    user,
    token,
    isAuthenticated,
    hasRole,
    isAdmin,
    isManager,
  };
};

export default useAuth;