import { useEffect, useState }     from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  setCredentials, logout,
  selectIsAuthenticated, selectToken,
} from "./store/slices/authSlice";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import Login          from "./pages/auth/Login";
import Register       from "./pages/auth/Register";
import Dashboard      from "./pages/dashboard/Dashboard";
import Employees      from "./pages/hr/Employees";
import EmployeeDetail from "./pages/hr/EmployeeDetail";
import Leaves         from "./pages/hr/Leaves";
import Attendance     from "./pages/hr/Attendance";
import Projects       from "./pages/projects/Projects";
import ProjectDetail  from "./pages/projects/ProjectDetail";
import MyTasks        from "./pages/tasks/MyTasks";
import Chat           from "./pages/chat/Chat";
import Notifications  from "./pages/notifications/Notifications";
import Files          from "./pages/files/Files";
import Analytics      from "./pages/analytics/Analytics";
import Settings       from "./pages/settings/Settings";
import { PageSpinner } from "./components/ui/Spinner";
import NotFound from "./pages/NotFound";

const PR = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
);

const App = () => {
  const dispatch        = useDispatch();
  const token           = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isVerifying, setIsVerifying] = useState(true);

  // On every app load — verify token is still valid
  // If token exists in localStorage but is expired or invalid
  // → logout and redirect to login
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        // No token → not logged in
        dispatch(logout());
        setIsVerifying(false);
        return;
      }

      try {
        // Call /api/auth/me to verify token is valid
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (!res.ok) {
          // Token invalid or expired → logout
          dispatch(logout());
          setIsVerifying(false);
          return;
        }

        const data = await res.json();

        // Token valid → set user in Redux
        dispatch(setCredentials({
          user:  data.data,
          token: storedToken,
        }));

      } catch (error) {
        // Network error or invalid token → logout
        dispatch(logout());
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [dispatch]);

  // Show spinner while verifying token
  // Prevents flash of wrong page
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
        justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex
            items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <PageSpinner />
          <p className="text-gray-400 text-sm">Loading Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Protected routes */}
      <Route path="/dashboard"
        element={<PR><Dashboard /></PR>}
      />
      <Route path="/hr/employees"
        element={
          <PR roles={["SUPER_ADMIN","ADMIN"]}>
            <Employees />
          </PR>
        }
      />
      <Route path="/hr/employees/:id"
        element={
          <PR roles={["SUPER_ADMIN","ADMIN"]}>
            <EmployeeDetail />
          </PR>
        }
      />
      <Route path="/hr/leaves"
        element={<PR><Leaves /></PR>}
      />
      <Route path="/hr/attendance"
        element={<PR><Attendance /></PR>}
      />
      <Route path="/projects"
        element={<PR><Projects /></PR>}
      />
      <Route path="/projects/:id"
        element={<PR><ProjectDetail /></PR>}
      />
      <Route path="/my-tasks"
        element={<PR><MyTasks /></PR>}
      />
      <Route path="/chat"
        element={<PR><Chat /></PR>}
      />
      <Route path="/notifications"
        element={<PR><Notifications /></PR>}
      />
      <Route path="/files"
        element={<PR><Files /></PR>}
      />
      <Route path="/analytics"
        element={
          <PR roles={["SUPER_ADMIN","ADMIN","MANAGER"]}>
            <Analytics />
          </PR>
        }
      />
      <Route path="/settings"
        element={<PR><Settings /></PR>}
      />
      <Route path="/profile"
        element={<PR><Settings /></PR>}
      />

      {/* Default redirects */}
      <Route path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
};

export default App;