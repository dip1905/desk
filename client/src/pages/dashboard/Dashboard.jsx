import { useSelector }              from "react-redux";
import { selectUser }               from "../../store/slices/authSlice";
import AppLayout                    from "../../components/layout/AppLayout";
import StatCard                     from "../../components/ui/StatCard";
import EmptyState                   from "../../components/ui/EmptyState";
import { PageSpinner }              from "../../components/ui/Spinner";
import {
  useGetOverviewQuery,
  useGetMySummaryQuery,
} from "../../store/api/analyticsApi";
import { useGetNotificationsQuery } from "../../store/api/notificationApi";
import { formatDate, formatRelative, getStatusColor } from "../../utils/formatters";
import {
  HiOutlineClipboardCheck,
  HiOutlineUsers,
  HiOutlineBell,
  HiOutlineCalendar,
} from "react-icons/hi";
import { BsKanban } from "react-icons/bs";

const Dashboard = () => {
  const user = useSelector(selectUser);

  const isManager = ["SUPER_ADMIN","ADMIN","MANAGER"]
    .includes(user?.role);

  const {
    data: overviewData,
    isLoading: loadingOverview,
  } = useGetOverviewQuery(undefined, { skip: !isManager });

  const {
    data: summaryData,
  } = useGetMySummaryQuery();

  const {
    data: notifData,
  } = useGetNotificationsQuery();

  const overview     = overviewData?.data;
  const summary      = summaryData?.data;
  const unreadNotifs = notifData?.data?.unreadCount || 0;

  return (
    <AppLayout title="Dashboard">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600
        rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full
            flex items-center justify-center text-2xl">
            👋
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Good to see you, {user?.name}!
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {formatDate(new Date())} — Here is what is happening today.
            </p>
          </div>
        </div>

        {/* Quick Stats in Banner */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5
          border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {summary?.tasks
                ? summary.tasks.todo + summary.tasks.inProgress
                : 0
              }
            </p>
            <p className="text-blue-100 text-xs mt-0.5">
              Active Tasks
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {isManager ? (overview?.pendingLeaves || 0) : "—"}
            </p>
            <p className="text-blue-100 text-xs mt-0.5">
              Pending Leaves
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{unreadNotifs}</p>
            <p className="text-blue-100 text-xs mt-0.5">
              New Notifications
            </p>
          </div>
        </div>
      </div>

      {/* Manager/Admin Overview Cards */}
      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2
          lg:grid-cols-4 gap-4 mb-6">
          {loadingOverview ? (
            <div className="col-span-4"><PageSpinner /></div>
          ) : (
            <>
              <StatCard
                icon={HiOutlineUsers}
                label="Total Employees"
                value={overview?.totalEmployees || 0}
                color="bg-blue-500"
              />
              <StatCard
                icon={BsKanban}
                label="Active Projects"
                value={overview?.activeProjects || 0}
                color="bg-purple-500"
              />
              <StatCard
                icon={HiOutlineClipboardCheck}
                label="Tasks Due Today"
                value={overview?.tasksDueToday || 0}
                color="bg-orange-500"
              />
              <StatCard
                icon={HiOutlineCalendar}
                label="Pending Leaves"
                value={overview?.pendingLeaves || 0}
                color="bg-green-500"
              />
            </>
          )}
        </div>
      )}

      {/* Employee Personal Stats */}
      {!isManager && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4
          gap-4 mb-6">
          <div className="bg-white rounded-xl p-5
            border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-800">
              {summary.tasks?.todo || 0}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">To Do</p>
          </div>
          <div className="bg-white rounded-xl p-5
            border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">
              {summary.tasks?.inProgress || 0}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">In Progress</p>
          </div>
          <div className="bg-white rounded-xl p-5
            border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">
              {summary.tasks?.done || 0}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-5
            border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">
              {summary.attendanceThisMonth || 0}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Days Present
            </p>
          </div>
        </div>
      )}

      {/* Leave Balance for Employees */}
      {!isManager && summary?.leaveBalance && (
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Leave Balance
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(summary.leaveBalance).map(([type, days]) => (
              <div key={type}
                className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">
                  {days}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {type} Leave
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Recent Notifications
          </h3>
          {notifData?.data?.notifications?.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="No notifications"
              description="You are all caught up!"
            />
          ) : (
            <div className="space-y-3">
              {notifData?.data?.notifications
                ?.slice(0, 5)
                .map((notif) => (
                  <div key={notif.id}
                    className={`flex items-start gap-3 p-3
                      rounded-lg transition-colors
                      ${!notif.isRead ? "bg-blue-50" : "bg-gray-50"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex
                      items-center justify-center text-sm flex-shrink-0
                      ${notif.type === "TASK"
                        ? "bg-blue-100 text-blue-600"
                        : notif.type === "LEAVE"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                      {notif.type === "TASK"  ? "📋" :
                       notif.type === "LEAVE" ? "🌿" : "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.isRead
                        ? "font-semibold text-gray-800"
                        : "text-gray-700"}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5
                        truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {formatRelative(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full
                        bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* My Tasks Summary */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            My Task Summary
          </h3>
          {!summary ? (
            <PageSpinner />
          ) : (
            <div className="space-y-3">
              {[
                {
                  label:  "To Do",
                  value:  summary.tasks?.todo || 0,
                  color:  "bg-gray-200",
                  fill:   "bg-gray-500",
                },
                {
                  label:  "In Progress",
                  value:  summary.tasks?.inProgress || 0,
                  color:  "bg-blue-100",
                  fill:   "bg-blue-500",
                },
                {
                  label:  "In Review",
                  value:  summary.tasks?.inReview || 0,
                  color:  "bg-yellow-100",
                  fill:   "bg-yellow-500",
                },
                {
                  label:  "Done",
                  value:  summary.tasks?.done || 0,
                  color:  "bg-green-100",
                  fill:   "bg-green-500",
                },
              ].map((item) => {
                const total = Object.values(summary.tasks || {})
                  .reduce((a, b) => a + b, 0);
                const pct = total > 0
                  ? Math.round((item.value / total) * 100)
                  : 0;

                return (
                  <div key={item.label}>
                    <div className="flex items-center
                      justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium
                        text-gray-800">
                        {item.value}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full
                      ${item.color}`}>
                      <div
                        className={`h-2 rounded-full ${item.fill}
                          transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 border-t border-gray-100
                flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Total Tasks
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {Object.values(summary.tasks || {})
                    .reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </AppLayout>
  );
};

export default Dashboard;