import { useState }               from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout                  from "../../components/layout/AppLayout";
import Modal                      from "../../components/ui/Modal";
import { PageSpinner }            from "../../components/ui/Spinner";
import EmptyState                 from "../../components/ui/EmptyState";
import {
  useGetProjectByIdQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useUpdateProjectMutation,
} from "../../store/api/projectApi";
import {
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from "../../store/api/taskApi";
import { useGetEmployeesQuery }   from "../../store/api/hrApi";
import {
  getPriorityColor, getInitials, formatDate,
} from "../../utils/formatters";
import { useDispatch }            from "react-redux";
import { moveTask }               from "../../store/slices/taskSlice";
import useAuth                    from "../../hooks/useAuth";
import toast                      from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUserAdd,
  HiOutlineX,
} from "react-icons/hi";

const COLUMNS = [
  { id: "TODO",        label: "To Do",       color: "bg-gray-400"   },
  { id: "IN_PROGRESS", label: "In Progress",  color: "bg-blue-500"   },
  { id: "IN_REVIEW",   label: "In Review",    color: "bg-yellow-500" },
  { id: "DONE",        label: "Done",         color: "bg-green-500"  },
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const ProjectDetail = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const dispatch      = useDispatch();
  const { isManager } = useAuth();

  const { data, isLoading, refetch } = useGetProjectByIdQuery(id);
  const { data: employeesData }      = useGetEmployeesQuery({});

  const [createTask,        { isLoading: isCreating  }] =
    useCreateTaskMutation();
  const [updateTaskStatus]  = useUpdateTaskStatusMutation();
  const [deleteTask]        = useDeleteTaskMutation();
  const [addMember,         { isLoading: isAdding    }] =
    useAddMemberMutation();
  const [removeMember]      = useRemoveMemberMutation();

  const project = data?.data;
  const tasks   = project?.tasks   || [];
  const members = project?.members || [];
  const allEmployees = employeesData?.data?.employees || [];

  // Employees not already in project
  const nonMembers = allEmployees.filter(
    (emp) => !members.some((m) => m.userId === emp.id)
  );

  const [isTaskModalOpen,   setIsTaskModalOpen]   = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [draggedTask,       setDraggedTask]       = useState(null);
  const [selectedUserId,    setSelectedUserId]    = useState("");

  const [form, setForm] = useState({
    title:        "",
    description:  "",
    priority:     "MEDIUM",
    deadline:     "",
    assignedToId: "",
  });

  const getTasksByStatus = (status) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = (task) => setDraggedTask(task);

  const handleDrop = async (newStatus) => {
    if (!draggedTask || draggedTask.status === newStatus) return;
    dispatch(moveTask({ taskId: draggedTask.id, newStatus }));
    try {
      await updateTaskStatus({
        id: draggedTask.id, status: newStatus
      }).unwrap();
      refetch();
    } catch {
      toast.error("Failed to update task status");
      refetch();
    }
    setDraggedTask(null);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        ...form,
        projectId:    id,
        assignedToId: form.assignedToId || undefined,
      }).unwrap();
      toast.success("Task created successfully");
      setIsTaskModalOpen(false);
      setForm({
        title: "", description: "",
        priority: "MEDIUM", deadline: "", assignedToId: "",
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await deleteTask(taskId).unwrap();
      toast.success("Task deleted");
      refetch();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await addMember({
        projectId: id,
        userId:    selectedUserId,
      }).unwrap();
      toast.success("Member added successfully");
      setIsMemberModalOpen(false);
      setSelectedUserId("");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from project?")) return;
    try {
      await removeMember({ projectId: id, userId }).unwrap();
      toast.success("Member removed");
      refetch();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  if (isLoading) return (
    <AppLayout title="Project">
      <PageSpinner />
    </AppLayout>
  );

  if (!project) return (
    <AppLayout title="Project">
      <div className="text-center py-12 text-gray-500">
        Project not found
      </div>
    </AppLayout>
  );

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const completionPct  = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  return (
    <AppLayout title={project.name}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="p-2 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineArrowLeft />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {project.name}
            </h2>
            <p className="text-gray-500 text-sm">
              {tasks.length} tasks •{" "}
              {members.length} members
              {project.deadline && (
                <> • Due {formatDate(project.deadline)}</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isManager() && (
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="flex items-center gap-2 bg-white
                hover:bg-gray-50 border border-gray-200
                text-gray-600 px-3 py-2 rounded-lg text-sm
                font-medium transition-colors"
            >
              <HiOutlineUserAdd className="text-lg" />
              Add Member
            </button>
          )}
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600
              hover:bg-blue-700 text-white px-4 py-2 rounded-lg
              text-sm font-medium transition-colors"
          >
            <HiOutlinePlus className="text-lg" />
            Add Task
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Project Progress
          </span>
          <span className="text-sm font-bold text-blue-600">
            {completionPct}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full">
          <div
            className="h-2 bg-blue-500 rounded-full
              transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2
          text-xs text-gray-400">
          <span>{completedTasks} of {tasks.length} tasks done</span>
          <div className="flex -space-x-1">
            {members.slice(0, 5).map((m) => (
              <div key={m.id}
                className="w-5 h-5 rounded-full bg-blue-500
                  border border-white flex items-center
                  justify-center text-white text-[9px] font-bold"
                title={m.user?.name}
              >
                {m.user?.name?.[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2
        xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
            className="flex flex-col bg-[#f5f6fa] rounded-xl
              p-3 min-h-[400px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full
                  ${col.color}`} />
                <span className="text-sm font-semibold text-gray-700">
                  {col.label}
                </span>
              </div>
              <span className="text-xs bg-white text-gray-500
                px-2 py-0.5 rounded-full border border-gray-200">
                {getTasksByStatus(col.id).length}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2 flex-1">
              {getTasksByStatus(col.id).length === 0 ? (
                <div className="flex items-center justify-center
                  flex-1 text-gray-300 text-xs">
                  Drop tasks here
                </div>
              ) : (
                getTasksByStatus(col.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white rounded-lg p-3 border
                      border-gray-100 shadow-sm cursor-grab
                      active:cursor-grabbing hover:shadow-md
                      transition-shadow"
                  >
                    <p className="text-sm font-medium text-gray-800
                      mb-2 leading-snug">
                      {task.title}
                    </p>

                    <span className={`text-xs px-2 py-0.5
                      rounded-full font-medium
                      ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>

                    <div className="flex items-center
                      justify-between mt-3">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full
                            bg-blue-500 flex items-center
                            justify-center text-white text-[10px]
                            font-bold">
                            {getInitials(task.assignedTo.name)}
                          </div>
                          <span className="text-xs text-gray-400">
                            {task.assignedTo.name.split(" ")[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">
                          Unassigned
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {task.deadline && (
                          <span className="text-xs text-gray-400">
                            {formatDate(task.deadline)}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-red-400
                            hover:text-red-600 hover:bg-red-50
                            rounded transition-colors"
                        >
                          <HiOutlineTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Task Title *</label>
            <input
              type="text" required
              value={form.title}
              onChange={(e) => setForm((p) => ({
                ...p, title: e.target.value
              }))}
              placeholder="Enter task title"
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
              placeholder="Task description..."
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({
                  ...p, priority: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
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

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Assign To</label>
            <select
              value={form.assignedToId}
              onChange={(e) => setForm((p) => ({
                ...p, assignedToId: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
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
              {isCreating ? "Creating..." : "Create Task"}
            </button>
          </div>

        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Add Member to Project"
      >
        <form onSubmit={handleAddMember} className="space-y-4">

          {/* Current Members */}
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-2">Current Members</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((m) => (
                <div key={m.id}
                  className="flex items-center justify-between
                    p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500
                      flex items-center justify-center text-white
                      text-xs font-bold">
                      {getInitials(m.user?.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {m.user?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {m.user?.role}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.userId)}
                    className="p-1 text-red-400 hover:text-red-600
                      hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                  >
                    <HiOutlineX className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Member */}
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Add New Member</label>
            {nonMembers.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                All employees are already members
              </p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select employee...</option>
                {nonMembers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.employee?.designation}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200
                rounded-lg text-sm font-medium text-gray-600
                hover:bg-gray-50"
            >
              Close
            </button>
            {nonMembers.length > 0 && (
              <button
                type="submit" disabled={isAdding || !selectedUserId}
                className="flex-1 bg-blue-600 hover:bg-blue-700
                  disabled:bg-blue-400 text-white px-4 py-2
                  rounded-lg text-sm font-medium"
              >
                {isAdding ? "Adding..." : "Add Member"}
              </button>
            )}
          </div>

        </form>
      </Modal>

    </AppLayout>
  );
};

export default ProjectDetail;