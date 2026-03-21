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
import { formatDate, getStatusColor } from "../../utils/formatters";
import useAuth                 from "../../hooks/useAuth";
import toast                   from "react-hot-toast";
import {
  HiOutlinePlus, HiOutlineTrash,
  HiOutlineEye, HiOutlineCalendar,
  HiOutlineUsers,
} from "react-icons/hi";

const STATUSES = ["PLANNING","ACTIVE","ON_HOLD","COMPLETED"];

const Projects = () => {
  const navigate              = useNavigate();
  const { isManager }         = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch } = useGetProjectsQuery();
  const [createProject, { isLoading: isCreating }] =
    useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();

  const projects = Array.isArray(data?.data) ? data.data : [];

  const [form, setForm] = useState({
    name: "", description: "",
    status: "PLANNING", deadline: "",
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject(form).unwrap();
      toast.success("Project created successfully");
      setIsModalOpen(false);
      setForm({
        name: "", description: "",
        status: "PLANNING", deadline: "",
      });
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
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const statusColors = {
    PLANNING:   "bg-gray-100 text-gray-600",
    ACTIVE:     "bg-green-100 text-green-600",
    ON_HOLD:    "bg-yellow-100 text-yellow-600",
    COMPLETED:  "bg-blue-100 text-blue-600",
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

      {isLoading ? (
        <PageSpinner />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No projects yet"
          description="Create your first project to get started"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
          gap-4">
          {projects.map((project) => (
            <div key={project.id}
              className="bg-white rounded-xl border border-gray-100
                shadow-sm p-5 hover:shadow-md transition-shadow">

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-base
                  leading-tight flex-1 mr-2">
                  {project.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full
                  font-medium flex-shrink-0
                  ${statusColors[project.status]}`}>
                  {project.status.replace("_", " ")}
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
                <span className="flex items-center gap-1">
                  {project._count?.tasks || 0} tasks
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <HiOutlineCalendar />
                    {formatDate(project.deadline)}
                  </span>
                )}
              </div>

              {/* Member avatars */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.members?.slice(0, 4).map((m) => (
                    <div key={m.id}
                      className="w-7 h-7 rounded-full bg-blue-500
                        border-2 border-white flex items-center
                        justify-center text-white text-xs font-bold">
                      {m.user?.avatar
                        ? <img src={m.user.avatar} alt=""
                            className="w-full h-full rounded-full
                              object-cover" />
                        : m.user?.name?.[0]
                      }
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
                    onClick={() =>
                      navigate(`/projects/${project.id}`)
                    }
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
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
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
              rows={3}
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
                    {s.replace("_", " ")}
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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