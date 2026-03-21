import AppLayout               from "../../components/layout/AppLayout";
import EmptyState              from "../../components/ui/EmptyState";
import { PageSpinner }         from "../../components/ui/Spinner";
import {
  useGetAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from "../../store/api/hrApi";
import {
  getInitials, getStatusColor, formatDate, formatTime,
} from "../../utils/formatters";
import toast                   from "react-hot-toast";
import { HiOutlineClock }      from "react-icons/hi";

const Attendance = () => {
  const { data, isLoading, refetch } = useGetAttendanceQuery({});
  const [checkIn,  { isLoading: isCheckingIn  }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const records = data?.data?.records || [];

  // Check if already checked in today
  const today = new Date().toDateString();
  const todayRecord = records.find(
    (r) => new Date(r.date).toDateString() === today
  );

  const handleCheckIn = async () => {
    try {
      await checkIn().unwrap();
      toast.success("Checked in successfully");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut().unwrap();
      toast.success("Checked out successfully");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to check out");
    }
  };

  return (
    <AppLayout title="Attendance">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Attendance</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatDate(new Date())}
          </p>
        </div>

        {/* Check in/out buttons */}
        <div className="flex items-center gap-3">
          {!todayRecord ? (
            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="flex items-center gap-2 bg-green-500
                hover:bg-green-600 disabled:bg-green-300 text-white
                px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <HiOutlineClock className="text-lg" />
              {isCheckingIn ? "Checking in..." : "Check In"}
            </button>
          ) : !todayRecord.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className="flex items-center gap-2 bg-orange-500
                hover:bg-orange-600 disabled:bg-orange-300 text-white
                px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <HiOutlineClock className="text-lg" />
              {isCheckingOut ? "Checking out..." : "Check Out"}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-100
              text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
              <HiOutlineClock className="text-lg" />
              Done for today ✅
            </div>
          )}
        </div>
      </div>

      {/* Today's Card */}
      {todayRecord && (
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-5 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Today</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Check In</p>
              <p className="font-bold text-gray-800">
                {formatTime(todayRecord.checkIn)}
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Check Out</p>
              <p className="font-bold text-gray-800">
                {todayRecord.checkOut
                  ? formatTime(todayRecord.checkOut)
                  : "—"
                }
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className={`text-xs px-2 py-0.5 rounded-full
                font-medium ${getStatusColor(todayRecord.status)}`}>
                {todayRecord.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Log */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Attendance Log</h3>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : records.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No attendance records"
            description="Check in to start tracking attendance"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Employee","Date","Check In","Check Out","Status"]
                    .map((h) => (
                    <th key={h} className="text-left text-xs font-semibold
                      text-gray-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}
                    className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500
                          flex items-center justify-center text-white
                          text-xs font-bold">
                          {getInitials(record.employee?.user?.name)}
                        </div>
                        <span className="text-sm text-gray-700">
                          {record.employee?.user?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTime(record.checkIn)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.checkOut
                        ? formatTime(record.checkOut)
                        : "—"
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </AppLayout>
  );
};

export default Attendance;