import { useState }            from "react";
import { useNavigate }         from "react-router-dom";
import AppLayout               from "../../components/layout/AppLayout";
import Modal                   from "../../components/ui/Modal";
import EmptyState              from "../../components/ui/EmptyState";
import { PageSpinner }         from "../../components/ui/Spinner";
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
} from "../../store/api/projectApi";
import { useGetEmployeesQuery } from "../../store/api/hrApi";
import { formatDate }           from "../../utils/formatters";
import useAuth                  from "../../hooks/useAuth";
import toast                    from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineCalendar,
  HiOutlineUsers,
} from "react-icons/hi";

const STATUSES    = ["PLANNING","ACTIVE","ON_HOLD","COMPLETED"];
const PROJ_ROLES  = [
  "COORDINATOR","TEAM_LEAD","DEVELOPER",
  "DESIGNER","TESTER","MEMBER"
];

const statusColors = {
  PLANNING:  "bg-gray-100 text-gray-600",
  ACTIVE:    "bg-green-100 text-green-600",
  ON_HOLD:   "bg-yellow-100 text-yellow-600",
  COMPLETED: "bg-blue-100 text-blue-600",
};

const Projects = () => {
  const navigate              = useNavigate();
  const { isManager, user }   = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch } = useGetProjectsQuery();
  const { data: empData }    = useGetEmployeesQuery({});
  const [createProject, { isLoading: isCreating }] =
    useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  // Fix: handle both array and object response
  const projects   = Array.isArray(data?.data)
    ? data.data
    : data?.data?.projects || [];
  const employees  = empData?.data?.employees || [];

  const [form, setForm] = useState({
    name:        "",
    description: "",
    status:      "PLANNING",
    deadline:    "",
  });

  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleAddMember = (empId) => {
    if (!empId) return;
    if (selectedMembers.find((m) => m.userId === empId)) return;
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setSelectedMembers((prev) => [
        ...prev,
        { userId: empId, name: emp.name, projectRole: "MEMBER" }
      ]);
    }
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => m.userId !== userId)
    );
  };

  const handleRoleChange = (userId, role) => {
    setSelectedMembers((prev) =>
      prev.map((m) => m.userId === userId
        ? { ...m, projectRole: role }
        : m
      )
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject({
        ...form,
        memberIds: selectedMembers.map((m) => m.userId),
      }).unwrap();
      toast.success("Project created successfully");
      setIsModalOpen(false);
      setForm({
        name: "", description: "",
        status: "PLANNING", deadline: "",
      });
      setSelectedMembers([]);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create project");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProject(id).unwrap();
      toast.success("Project deleted");
      refetch();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <AppLayout title="Projects">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Projects</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {projects.length} projects
          </p>
        </div>
        {isManager() && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600
              hover:bg-blue-700 text-white px-4 py-2 rounded-lg
              text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="text-lg" />
            New Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <PageSpinner />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No projects yet"
          description={isManager()
            ? "Create your first project to get started"
            : "You have not been added to any projects yet"
          }
          action={isManager() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2
                rounded-lg text-sm font-medium"
            >
              Create Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2
          lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-gray-100
                shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-base
                  leading-tight flex-1 mr-2">
                  {project.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full
                  font-medium flex-shrink-0
                  ${statusColors[project.status]}`}>
                  {project.status.replace("_"," ")}
                </span>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs
                text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <HiOutlineUsers />
                  {project.members?.length || 0} members
                </span>
                <span>
                  {project._count?.tasks || 0} tasks
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <HiOutlineCalendar />
                    {formatDate(project.deadline)}
                  </span>
                )}
              </div>

              {/* Member Avatars + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-blue-500
                        border-2 border-white flex items-center
                        justify-center text-white text-xs font-bold"
                      title={`${m.user?.name} (${m.projectRole || "MEMBER"})`}
                    >
                      {m.user?.name?.[0]}
                    </div>
                  ))}
                  {(project.members?.length || 0) > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-200
                      border-2 border-white flex items-center
                      justify-center text-gray-600 text-xs font-bold">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50
                      rounded-lg transition-colors"
                    title="View"
                  >
                    <HiOutlineEye className="text-base" />
                  </button>
                  {isManager() && (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50
                        rounded-lg transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMembers([]);
        }}
        title="Create New Project"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Project Name *</label>
            <input
              type="text" required
              value={form.name}
              onChange={(e) => setForm((p) => ({
                ...p, name: e.target.value
              }))}
              placeholder="Enter project name"
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({
                ...p, description: e.target.value
              }))}
              placeholder="Project description..."
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({
                  ...p, status: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_"," ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({
                  ...p, deadline: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Add Team Members */}
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-2">Add Team Members</label>

            <select
              onChange={(e) => {
                handleAddMember(e.target.value);
                e.target.value = "";
              }}
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 bg-white mb-2"
            >
              <option value="">Select employee to add...</option>
              {employees
                .filter((e) => e.id !== user?.id)
                .filter((e) => !selectedMembers
                  .find((m) => m.userId === e.id))
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.employee?.designation}
                  </option>
                ))
              }
            </select>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedMembers.map((m) => (
                  <div key={m.userId}
                    className="flex items-center gap-2 p-2
                      bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-500
                      flex items-center justify-center text-white
                      text-xs font-bold flex-shrink-0">
                      {m.name?.[0]}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      {m.name}
                    </span>
                    <select
                      value={m.projectRole}
                      onChange={(e) =>
                        handleRoleChange(m.userId, e.target.value)
                      }
                      className="text-xs border border-gray-200
                        rounded px-2 py-1 bg-white focus:outline-none"
                    >
                      {PROJ_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_"," ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-red-400 hover:text-red-600
                        text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedMembers([]);
              }}
              className="flex-1 px-4 py-2 border border-gray-200
                rounded-lg text-sm font-medium text-gray-600
                hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 text-white px-4 py-2
                rounded-lg text-sm font-medium"
            >
              {isCreating ? "Creating..." : "Create Project"}
            </button>
          </div>

        </form>
      </Modal>

    </AppLayout>
  );
};

export default Projects;