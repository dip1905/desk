import { useState }              from "react";
import { useNavigate }           from "react-router-dom";
import AppLayout                 from "../../components/layout/AppLayout";
import Modal                     from "../../components/ui/Modal";
import EmptyState                from "../../components/ui/EmptyState";
import { PageSpinner }           from "../../components/ui/Spinner";
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "../../store/api/hrApi";
import {
  getInitials,
  getRoleBadgeColor,
  formatDate,
  formatCurrency,
} from "../../utils/formatters";
import useAuth       from "../../hooks/useAuth";
import useDebounce   from "../../hooks/useDebounce";
import toast         from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
} from "react-icons/hi";

const DEPARTMENTS = [
  "ENGINEERING", "DESIGN", "MARKETING",
  "SALES", "HR", "FINANCE",
];

const EMP_TYPES = [
  "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN",
];

const Employees = () => {
  const navigate             = useNavigate();
  const { user, isAdmin }    = useAuth();
  const [search, setSearch]  = useState("");
  const [dept,   setDept]    = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch      = useDebounce(search);

  const { data, isLoading, refetch } = useGetEmployeesQuery({
    search:     debouncedSearch || undefined,
    department: dept            || undefined,
  });

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const employees = data?.data?.employees || [];

  // ─── ROLE OPTIONS BASED ON LOGGED IN USER ─────────
  const getAvailableRoles = () => {
    if (user?.role === "SUPER_ADMIN") {
      return ["EMPLOYEE", "MANAGER", "ADMIN"];
    }
    // ADMIN (HR) can only create MANAGER and EMPLOYEE
    return ["EMPLOYEE", "MANAGER"];
  };

  const getRoleHint = () => {
    if (user?.role === "SUPER_ADMIN") {
      return "As Super Admin you can create Admin, Manager and Employee accounts";
    }
    return "As Admin you can create Manager and Employee accounts";
  };

  // ─── FORM STATE ───────────────────────────────────
  const [form, setForm] = useState({
    name:           "",
    email:          "",
    password:       "",
    role:           "EMPLOYEE",
    department:     "ENGINEERING",
    designation:    "",
    employmentType: "FULL_TIME",
    salary:         "",
    joiningDate:    "",
    phone:          "",
    address:        "",
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      name:           "",
      email:          "",
      password:       "",
      role:           "EMPLOYEE",
      department:     "ENGINEERING",
      designation:    "",
      employmentType: "FULL_TIME",
      salary:         "",
      joiningDate:    "",
      phone:          "",
      address:        "",
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createEmployee({
        ...form,
        salary: Number(form.salary),
      }).unwrap();
      toast.success("Employee created successfully");
      setIsModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create employee");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    try {
      await deleteEmployee(id).unwrap();
      toast.success("Employee deactivated");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to deactivate");
    }
  };

  return (
    <AppLayout title="Employees">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Employee Directory
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {employees.length} employees
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600
              hover:bg-blue-700 text-white px-4 py-2 rounded-lg
              text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="text-lg" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2
            -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200
              rounded-lg text-sm focus:outline-none
              focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg
            text-sm focus:outline-none focus:ring-2
            focus:ring-blue-500 bg-white"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {isLoading ? (
          <PageSpinner />
        ) : employees.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No employees found"
            description="Add your first employee to get started"
            action={isAdmin() && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2
                  rounded-lg text-sm font-medium"
              >
                Add Employee
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Employee",
                    "Department",
                    "Designation",
                    "Type",
                    "Joined",
                    "Role",
                    // Show salary column only to SUPER_ADMIN
                    ...(user?.role === "SUPER_ADMIN" ? ["Salary"] : []),
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold
                        text-gray-500 uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-gray-50
                      hover:bg-gray-50 transition-colors"
                  >

                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-500
                          flex items-center justify-center text-white
                          text-xs font-bold flex-shrink-0">
                          {emp.avatar
                            ? <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-full h-full rounded-full
                                  object-cover"
                              />
                            : getInitials(emp.name)
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {emp.employee?.department || "—"}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {emp.employee?.designation || "—"}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600
                        px-2 py-0.5 rounded-full">
                        {emp.employee?.employmentType
                          ?.replace("_", " ") || "—"
                        }
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(emp.employee?.joiningDate)}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        font-medium ${getRoleBadgeColor(emp.role)}`}>
                        {emp.role}
                      </span>
                    </td>

                    {/* Salary — SUPER_ADMIN only */}
                    {user?.role === "SUPER_ADMIN" && (
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {emp.employee?.salary
                            ? formatCurrency(emp.employee.salary)
                            : "—"
                          }
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/hr/employees/${emp.id}`)
                          }
                          className="p-1.5 text-blue-500
                            hover:bg-blue-50 rounded-lg
                            transition-colors"
                          title="View Profile"
                        >
                          <HiOutlineEye className="text-base" />
                        </button>
                        {isAdmin() && emp.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 text-red-500
                              hover:bg-red-50 rounded-lg
                              transition-colors"
                            title="Deactivate"
                          >
                            <HiOutlineTrash className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Add New Employee"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Full Name *</label>
              <input
                type="text" name="name" required
                value={form.name}
                onChange={handleFormChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Email *</label>
              <input
                type="email" name="email" required
                value={form.email}
                onChange={handleFormChange}
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Password *</label>
              <input
                type="password" name="password" required
                value={form.password}
                onChange={handleFormChange}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role — dynamic based on logged in user */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {getAvailableRoles().map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {getRoleHint()}
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Department *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Designation *</label>
              <input
                type="text" name="designation" required
                value={form.designation}
                onChange={handleFormChange}
                placeholder="Software Engineer"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Employment Type *</label>
              <select
                name="employmentType"
                value={form.employmentType}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {EMP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Salary *</label>
              <input
                type="number" name="salary" required
                value={form.salary}
                onChange={handleFormChange}
                placeholder="50000"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Joining Date *</label>
              <input
                type="date" name="joiningDate" required
                value={form.joiningDate}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Phone</label>
              <input
                type="text" name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Address</label>
            <textarea
              name="address" rows={2}
              value={form.address}
              onChange={handleFormChange}
              placeholder="Employee address"
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Who is creating — info box */}
          <div className="bg-blue-50 border border-blue-100
            rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Creating as:</span>{" "}
              {user?.name} ({user?.role?.replace("_", " ")})
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              {getRoleHint()}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-200
                rounded-lg text-sm font-medium text-gray-600
                hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 text-white px-4 py-2
                rounded-lg text-sm font-medium transition-colors"
            >
              {isCreating ? "Creating..." : "Create Employee"}
            </button>
          </div>

        </form>
      </Modal>

    </AppLayout>
  );
};

export default Employees;