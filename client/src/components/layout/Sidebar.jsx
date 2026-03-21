import { useState }                 from "react";
import { NavLink, useNavigate }     from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser }       from "../../store/slices/authSlice";
import { getInitials }              from "../../utils/formatters";
import toast                        from "react-hot-toast";
import { RxDashboard }              from "react-icons/rx";
import {
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineChat,
  HiOutlineBell,
  HiOutlineFolder,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardCheck,
} from "react-icons/hi";
import { BsKanban } from "react-icons/bs";

// roles: [] = all roles can see
// roles: ["ADMIN"] = only listed roles can see
const navItems = [
  {
    group: "MAIN",
    items: [
      {
        label: "Dashboard",
        path:  "/dashboard",
        icon:  RxDashboard,
        roles: [],
      },
    ]
  },
  {
    group: "WORKSPACE",
    items: [
      {
        label: "Projects",
        path:  "/projects",
        icon:  BsKanban,
        roles: [],
      },
      {
        label: "My Tasks",
        path:  "/my-tasks",
        icon:  HiOutlineClipboardCheck,
        roles: [],
      },
    ]
  },
  {
    group: "HR",
    items: [
      {
        label: "Employees",
        path:  "/hr/employees",
        icon:  HiOutlineUsers,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        label: "Leaves",
        path:  "/hr/leaves",
        icon:  HiOutlineCalendar,
        roles: [],
      },
      {
        label: "Attendance",
        path:  "/hr/attendance",
        icon:  HiOutlineClipboardList,
        roles: [],
      },
    ]
  },
  {
    group: "COMMUNICATION",
    items: [
      {
        label: "Chat",
        path:  "/chat",
        icon:  HiOutlineChat,
        roles: [],
      },
      {
        label: "Notifications",
        path:  "/notifications",
        icon:  HiOutlineBell,
        roles: [],
      },
    ]
  },
  {
    group: "STORAGE",
    items: [
      {
        label: "Files",
        path:  "/files",
        icon:  HiOutlineFolder,
        roles: [],
      },
    ]
  },
  {
    group: "REPORTS",
    items: [
      {
        label: "Analytics",
        path:  "/analytics",
        icon:  HiOutlineChartBar,
        roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      },
    ]
  },
];

const Sidebar = () => {
  const dispatch                    = useDispatch();
  const navigate                    = useNavigate();
  const user                        = useSelector(selectUser);
  const [collapsed, setCollapsed]   = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Filter nav items based on user role
  const filteredNavItems = navItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.length === 0 ||
        item.roles.includes(user?.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-[#1a1f2e]
        text-white transition-all duration-300 ease-in-out
        flex-shrink-0
        ${collapsed ? "w-[70px]" : "w-[240px]"}
      `}
    >

      {/* Logo */}
      <div className="flex items-center h-16 px-4
        border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg
            flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg
              tracking-wide">
              Desk
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6
          bg-blue-500 rounded-full flex items-center
          justify-center text-white hover:bg-blue-600
          transition-colors z-10 shadow-md"
      >
        {collapsed
          ? <HiOutlineChevronRight className="text-xs" />
          : <HiOutlineChevronLeft  className="text-xs" />
        }
      </button>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {filteredNavItems.map((group) => (
          <div key={group.group}>

            {!collapsed && (
              <p className="text-[10px] font-semibold text-white/30
                uppercase tracking-widest px-3 mb-1">
                {group.group}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : ""}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5
                      rounded-lg text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <Icon className="text-lg flex-shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>

          </div>
        ))}
      </nav>

      {/* Settings + Logout */}
      <div className="border-t border-white/10 p-2 space-y-0.5">
        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : ""}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-sm font-medium transition-all duration-150
            ${isActive
              ? "bg-blue-500/20 text-blue-400"
              : "text-white/60 hover:bg-white/5 hover:text-white"
            }
          `}
        >
          <HiOutlineCog className="text-lg flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className="w-full flex items-center gap-3 px-3 py-2.5
            rounded-lg text-sm font-medium text-white/60
            hover:bg-red-500/10 hover:text-red-400
            transition-all duration-150"
        >
          <HiOutlineLogout className="text-lg flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500
            flex items-center justify-center flex-shrink-0
            text-white text-xs font-bold">
            {user?.avatar
              ? <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              : getInitials(user?.name)
            }
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.name}
              </p>
              <p className="text-white/40 text-xs truncate">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;