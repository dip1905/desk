import { useState }                from "react";
import { useNavigate }             from "react-router-dom";
import { useSelector }             from "react-redux";
import { selectUser }              from "../../store/slices/authSlice";
import { selectUnreadCount }       from "../../store/slices/notificationSlice";
import { getInitials }             from "../../utils/formatters";
import {
  HiOutlineBell, HiOutlineSearch, HiOutlineCog,
} from "react-icons/hi";

const Navbar = ({ title = "Dashboard" }) => {
  const navigate    = useNavigate();
  const user        = useSelector(selectUser);
  const unreadCount = useSelector(selectUnreadCount);
  const [search, setSearch] = useState("");

  return (
    <header className="h-16 bg-white border-b border-gray-200
      flex items-center justify-between px-6 flex-shrink-0">

      {/* Left — Page title */}
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>

      {/* Right — Search + Icons + Avatar */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm
              text-gray-700 placeholder-gray-400 focus:outline-none
              focus:ring-2 focus:ring-blue-500 focus:bg-white
              transition-all w-48 focus:w-64"
          />
        </div>

        {/* Notification bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 text-gray-500 hover:text-gray-700
            hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiOutlineBell className="text-xl" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500
              rounded-full text-white text-[10px] font-bold
              flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="p-2 text-gray-500 hover:text-gray-700
            hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiOutlineCog className="text-xl" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* Avatar */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 hover:bg-gray-100
            rounded-lg px-2 py-1.5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center
            justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name}
                  className="w-full h-full rounded-full object-cover" />
              : getInitials(user?.name)
            }
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-gray-800 leading-none">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
        </button>

      </div>
    </header>
  );
};

export default Navbar;