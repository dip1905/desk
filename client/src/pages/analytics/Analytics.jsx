import AppLayout                    from "../../components/layout/AppLayout";
import { PageSpinner }              from "../../components/ui/Spinner";
import StatCard                     from "../../components/ui/StatCard";
import {
  useGetOverviewQuery,
  useGetTaskStatsQuery,
  useGetAttendanceStatsQuery,
  useGetMySummaryQuery,
} from "../../store/api/analyticsApi";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import {
  HiOutlineClipboardCheck, HiOutlineUsers,
  HiOutlineBell, HiOutlineCalendar,
} from "react-icons/hi";
import { BsKanban } from "react-icons/bs";

const COLORS = ["#6366f1","#3b82f6","#eab308","#22c55e"];

const Analytics = () => {
  const { data: overview, isLoading: loadingOverview } =
    useGetOverviewQuery();
  const { data: taskStats, isLoading: loadingTasks } =
    useGetTaskStatsQuery();
  const { data: attendanceStats, isLoading: loadingAttendance } =
    useGetAttendanceStatsQuery();
  const { data: mySummary } = useGetMySummaryQuery();

  const overviewData    = overview?.data;
  const taskData        = taskStats?.data;
  const attendanceData  = attendanceStats?.data || [];

  const taskPieData = taskData ? [
    { name: "To Do",       value: taskData.todo },
    { name: "In Progress", value: taskData.inProgress },
    { name: "In Review",   value: taskData.inReview },
    { name: "Done",        value: taskData.done },
  ] : [];

  if (loadingOverview) return (
    <AppLayout title="Analytics"><PageSpinner /></AppLayout>
  );

  return (
    <AppLayout title="Analytics">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Analytics Dashboard
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">
          Company-wide insights and metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={HiOutlineUsers}
          label="Total Employees"
          value={overviewData?.totalEmployees || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={BsKanban}
          label="Active Projects"
          value={overviewData?.activeProjects || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={HiOutlineClipboardCheck}
          label="Tasks Due Today"
          value={overviewData?.tasksDueToday || 0}
          color="bg-orange-500"
        />
        <StatCard
          icon={HiOutlineCalendar}
          label="Pending Leaves"
          value={overviewData?.pendingLeaves || 0}
          color="bg-green-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Task Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Tasks by Status
          </h3>
          {loadingTasks ? (
            <PageSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskPieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskPieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Attendance Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Attendance This Week
          </h3>
          {loadingAttendance ? (
            <PageSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present"  fill="#22c55e" name="Present" />
                <Bar dataKey="absent"   fill="#ef4444" name="Absent"  />
                <Bar dataKey="halfDay"  fill="#eab308" name="Half Day"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* My Summary */}
      {mySummary?.data && (
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            My Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {[
              ["To Do",       mySummary.data.tasks.todo,       "bg-gray-50"],
              ["In Progress", mySummary.data.tasks.inProgress, "bg-blue-50"],
              ["In Review",   mySummary.data.tasks.inReview,   "bg-yellow-50"],
              ["Done",        mySummary.data.tasks.done,       "bg-green-50"],
            ].map(([label, value, bg]) => (
              <div key={label}
                className={`text-center p-4 ${bg} rounded-lg`}>
                <p className="text-2xl font-bold text-gray-800">
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}

          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">
                {mySummary.data.attendanceThisMonth}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Days Present This Month
              </p>
            </div>

            {mySummary.data.leaveBalance && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">
                  {Object.values(mySummary.data.leaveBalance)
                    .reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total Leave Balance
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </AppLayout>
  );
};

export default Analytics;