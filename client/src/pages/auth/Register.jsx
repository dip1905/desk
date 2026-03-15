import { useState, useEffect }     from "react";
import { useDispatch }             from "react-redux";
import { useNavigate, Link }       from "react-router-dom";
import { useRegisterMutation }     from "../../store/api/authApi";
import { setCredentials }          from "../../store/slices/authSlice";
import toast                       from "react-hot-toast";

const Register = () => {
  const dispatch                     = useDispatch();
  const navigate                     = useNavigate();
  const [register, { isLoading }]    = useRegisterMutation();
  const [isFirstSetup, setIsFirstSetup] = useState(null);

  const [formData, setFormData] = useState({
    name:     "",
    email:    "",
    password: "",
    role:     "SUPER_ADMIN",
  });

  const [errors, setErrors] = useState({});

  // Check if first time setup on mount
  useEffect(() => {
    const checkFirstSetup = async () => {
      try {
        const res  = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/check-setup`
        );
        const data = await res.json();
        setIsFirstSetup(data.isFirstSetup);

        // Already set up → redirect to login
        if (!data.isFirstSetup) {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      }
    };
    checkFirstSetup();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
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
      const result = await register(formData).unwrap();

      dispatch(setCredentials({
        user:  result.data.user,
        token: result.data.token,
      }));

      toast.success(result.message);
      navigate("/dashboard");

    } catch (error) {
      const message = error?.data?.message || "Registration failed.";
      toast.error(message);
    }
  };

  // Show loading while checking setup
  if (isFirstSetup === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Desk</h1>
          <p className="text-gray-500 mt-2">First time setup</p>
        </div>

        {/* First setup info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800 text-sm font-medium">
            👋 Welcome! Create the owner account to get started.
          </p>
          <p className="text-blue-600 text-xs mt-1">
            After this, all employee accounts are created from inside the app by admins.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Create owner account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.name
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                  }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="owner@company.com"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                  }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white"
                  }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white font-medium py-2.5 rounded-lg text-sm
                transition-colors duration-200 mt-2"
            >
              {isLoading ? "Setting up..." : "Create owner account"}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already set up?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;