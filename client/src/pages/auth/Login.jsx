import { useState }          from "react";
import { useDispatch }       from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useLoginMutation }  from "../../store/api/authApi";
import { setCredentials }    from "../../store/slices/authSlice";
import toast                 from "react-hot-toast";

const Login = () => {
  const dispatch               = useDispatch();
  const navigate               = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email:    "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
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
      const result = await login(formData).unwrap();

      dispatch(setCredentials({
        user:  result.data.user,
        token: result.data.token,
      }));

      toast.success(`Welcome back, ${result.data.user.name}!`);
      navigate("/dashboard");

    } catch (error) {
      const message = error?.data?.message || "Login failed. Try again.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Desk</h1>
          <p className="text-gray-500 mt-2">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

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
                placeholder="you@company.com"
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
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Create one
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;