import { useParams, useNavigate }  from "react-router-dom";
import AppLayout                   from "../../components/layout/AppLayout";
import { PageSpinner }             from "../../components/ui/Spinner";
import { useGetEmployeeByIdQuery } from "../../store/api/hrApi";
import {
  getInitials, getRoleBadgeColor,
  formatDate, formatCurrency, getStatusColor,
} from "../../utils/formatters";
import useAuth                     from "../../hooks/useAuth";
import { HiOutlineArrowLeft }      from "react-icons/hi";

const EmployeeDetail = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const { data, isLoading } = useGetEmployeeByIdQuery(id);
  const employee = data?.data;

  // Only SUPER_ADMIN can see salary
  const canSeeSalary = user?.role === "SUPER_ADMIN";

  if (isLoading) return (
    <AppLayout title="Employee Profile">
      <PageSpinner />
    </AppLayout>
  );

  if (!employee) return (
    <AppLayout title="Employee Profile">
      <div className="text-center py-12 text-gray-500">
        Employee not found
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Employee Profile">

      {/* Back */}
      <button
        onClick={() => navigate("/hr/employees")}
        className="flex items-center gap-2 text-gray-500
          hover:text-gray-700 mb-6 text-sm"
      >
        <HiOutlineArrowLeft />
        Back to Employees
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100
          shadow-sm p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500
            flex items-center justify-center text-white
            text-2xl font-bold mx-auto mb-4">
            {employee.avatar
              ? <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-full h-full rounded-full object-cover"
                />
              : getInitials(employee.name)
            }
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            {employee.name}
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {employee.employee?.designation}
          </p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5
            rounded-full font-medium
            ${getRoleBadgeColor(employee.role)}`}>
            {employee.role}
          </span>

          <div className="mt-4 pt-4 border-t border-gray-100
            text-left space-y-3">
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-700">{employee.email}</p>
            </div>
            {employee.employee?.phone && (
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm text-gray-700">
                  {employee.employee.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Joined</p>
              <p className="text-sm text-gray-700">
                {formatDate(employee.employee?.joiningDate)}
              </p>
            </div>

            {/* Salary — SUPER_ADMIN only */}
            {canSeeSalary && employee.employee?.salary && (
              <div>
                <p className="text-xs text-gray-400">
                  Salary
                  <span className="ml-1 text-[10px] bg-purple-100
                    text-purple-600 px-1.5 py-0.5 rounded">
                    Super Admin only
                  </span>
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  {formatCurrency(employee.employee.salary)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Job Info */}
          <div className="bg-white rounded-xl border border-gray-100
            shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              Job Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Department",
                  employee.employee?.department],
                ["Designation",
                  employee.employee?.designation],
                ["Employment Type",
                  employee.employee?.employmentType
                    ?.replace("_", " ")],
                ["Tasks Assigned",
                  employee._count?.assignedTasks],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Balance */}
          {employee.employee?.leaveBalance && (
            <div className="bg-white rounded-xl border
              border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Leave Balance
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(employee.employee.leaveBalance)
                  .map(([type, days]) => (
                    <div key={type}
                      className="text-center p-3 bg-gray-50
                        rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">
                        {days}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5
                        capitalize">
                        {type} Leave
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Recent Leaves */}
          {employee.employee?.leaves?.length > 0 && (
            <div className="bg-white rounded-xl border
              border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Recent Leaves
              </h3>
              <div className="space-y-2">
                {employee.employee.leaves.map((leave) => (
                  <div key={leave.id}
                    className="flex items-center justify-between
                      py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium
                        text-gray-700 capitalize">
                        {leave.type} Leave
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(leave.from)} —{" "}
                        {formatDate(leave.to)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5
                      rounded-full font-medium
                      ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attendance */}
          {employee.employee?.attendances?.length > 0 && (
            <div className="bg-white rounded-xl border
              border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Recent Attendance
              </h3>
              <div className="space-y-2">
                {employee.employee.attendances
                  .slice(0, 5)
                  .map((att) => (
                    <div key={att.id}
                      className="flex items-center justify-between
                        py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm text-gray-700">
                        {formatDate(att.date)}
                      </p>
                      <span className={`text-xs px-2 py-0.5
                        rounded-full font-medium
                        ${getStatusColor(att.status)}`}>
                        {att.status}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeeDetail;