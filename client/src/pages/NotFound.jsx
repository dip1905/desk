import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
      justify-center p-4">
      <div className="text-center">

        {/* Logo */}
        <div className="w-16 h-16 bg-blue-500 rounded-2xl
          flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">D</span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold text-gray-200 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Page not found
        </h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist
          or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200
              rounded-lg text-sm font-medium text-gray-600
              hover:bg-gray-100 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700
              text-white rounded-lg text-sm font-medium
              transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotFound;