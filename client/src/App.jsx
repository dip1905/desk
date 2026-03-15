import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute               from "./components/layout/ProtectedRoute";
import Login                        from "./pages/auth/Login";
import Register                     from "./pages/auth/Register";
import Dashboard                    from "./pages/dashboard/Dashboard";

const App = () => {
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/login"     replace />} />

    </Routes>
  );
};

export default App;