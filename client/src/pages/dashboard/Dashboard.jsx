import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser }  from "../../store/slices/authSlice";
import { logout }      from "../../store/slices/authSlice";
import toast           from "react-hot-toast";

const Dashboard = () => {
  const user     = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Desk 🎉
          </h1>
          <p className="text-gray-500 mb-6">
            You are logged in successfully
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Name: </span>
              <span className="text-gray-600">{user?.name}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Email: </span>
              <span className="text-gray-600">{user?.email}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Role: </span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5
                rounded text-xs font-medium">
                {user?.role}
              </span>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white
              px-4 py-2 rounded-lg text-sm font-medium
              transition-colors duration-200"
          >
            Logout
          </button>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;