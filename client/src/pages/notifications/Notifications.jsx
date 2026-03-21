import AppLayout                    from "../../components/layout/AppLayout";
import EmptyState                   from "../../components/ui/EmptyState";
import { PageSpinner }              from "../../components/ui/Spinner";
import { useDispatch }              from "react-redux";
import {
  markAsRead as markAsReadLocal,
  markAllAsRead as markAllAsReadLocal,
} from "../../store/slices/notificationSlice";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../../store/api/notificationApi";
import { formatRelative } from "../../utils/formatters";
import toast              from "react-hot-toast";
import {
  HiOutlineBell, HiOutlineCheck,
} from "react-icons/hi";

const typeColors = {
  TASK:   "bg-blue-100 text-blue-600",
  LEAVE:  "bg-green-100 text-green-600",
  CHAT:   "bg-purple-100 text-purple-600",
  SYSTEM: "bg-gray-100 text-gray-600",
};

const Notifications = () => {
  const dispatch = useDispatch();

  const { data, isLoading, refetch } = useGetNotificationsQuery();
  const [markAsRead]    = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications  = data?.data?.notifications || [];
  const unreadCount    = data?.data?.unreadCount    || 0;

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
      dispatch(markAsReadLocal(id));
      refetch();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      dispatch(markAllAsReadLocal());
      refetch();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <AppLayout title="Notifications">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Notifications
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {unreadCount} unread notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-blue-600
              hover:text-blue-700 text-sm font-medium"
          >
            <HiOutlineCheck />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {isLoading ? (
          <PageSpinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description="You are all caught up!"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                className={`flex items-start gap-4 p-4 cursor-pointer
                  hover:bg-gray-50 transition-colors
                  ${!notif.isRead ? "bg-blue-50/50" : ""}`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center
                  justify-center flex-shrink-0 text-sm
                  ${typeColors[notif.type] || typeColors.SYSTEM}`}>
                  <HiOutlineBell />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.isRead
                    ? "font-semibold text-gray-800"
                    : "font-medium text-gray-700"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelative(notif.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-500
                    flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </AppLayout>
  );
};

export default Notifications;