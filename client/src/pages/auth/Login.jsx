import { useState }          from "react";
import { useDispatch }       from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation }  from "../../store/api/authApi";
import { setCredentials }    from "../../store/slices/authSlice";
import toast                 from "react-hot-toast";

const DEMO_CREDENTIALS = [
  { role: "Super Admin", email: "superadmin@desk.com" },
  { role: "Admin (HR)",  email: "hr@desk.com"         },
  { role: "Manager",     email: "amit@desk.com"        },
  { role: "Employee",    email: "priya@desk.com"       },
];

const Login = () => {
  const dispatch               = useDispatch();
  const navigate               = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: "", password: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Quick fill from demo credentials
  const handleDemoLogin = (email) => {
    setFormData({ email, password: "Admin@123" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email)
      newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    if (!formData.password)
      newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const result = await login(formData).unwrap();
      dispatch(setCredentials({
        user:  result.data.user,
        token: result.data.token,
      }));
      toast.success(`Welcome back, ${result.data.user.name}!`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
      justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500 rounded-xl
            flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Desk</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sign in to your workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border
          border-gray-200 p-8 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Email address</label>
              <input
                type="email" name="email"
                value={formData.email} onChange={handleChange}
                placeholder="you@company.com"
                className={`w-full px-4 py-2.5 rounded-lg border
                  text-sm focus:outline-none focus:ring-2
                  focus:ring-blue-500
                  ${errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Password</label>
              <input
                type="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border
                  text-sm focus:outline-none focus:ring-2
                  focus:ring-blue-500
                  ${errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                  }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 text-white font-medium
                py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-amber-50 border border-amber-200
          rounded-xl p-4">
          <p className="text-amber-800 text-xs font-semibold mb-3
            flex items-center gap-1">
            🔑 Demo Credentials — Password for all: Admin@123
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                onClick={() => handleDemoLogin(cred.email)}
                className="text-left p-2 bg-white border
                  border-amber-200 rounded-lg hover:border-amber-400
                  hover:bg-amber-50 transition-colors"
              >
                <p className="text-xs font-semibold text-amber-800">
                  {cred.role}
                </p>
                <p className="text-[11px] text-amber-600 truncate">
                  {cred.email}
                </p>
              </button>
            ))}
          </div>
          <p className="text-amber-600 text-[11px] mt-2 text-center">
            Click any role above to auto-fill credentials
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;