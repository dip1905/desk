import { useState }              from "react";
import AppLayout                 from "../../components/layout/AppLayout";
import EmptyState                from "../../components/ui/EmptyState";
import { PageSpinner }           from "../../components/ui/Spinner";
import { useGetTasksQuery }      from "../../store/api/taskApi";
import {
  getPriorityColor, getStatusColor,
  formatDate, formatRelative,
} from "../../utils/formatters";
import { HiOutlineFilter }       from "react-icons/hi";

const MyTasks = () => {
  const [statusFilter,   setStatusFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { data, isLoading } = useGetTasksQuery({
    status:   statusFilter   || undefined,
    priority: priorityFilter || undefined,
  });

  const tasks = data?.data?.tasks || [];

  const isOverdue = (task) => {
    return task.deadline &&
      new Date(task.deadline) < new Date() &&
      task.status !== "DONE";
  };

  return (
    <AppLayout title="My Tasks">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {tasks.length} tasks assigned to you
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4 flex gap-3 flex-wrap items-center">
        <HiOutlineFilter className="text-gray-400" />

        <div className="flex gap-2 flex-wrap">
          {["","TODO","IN_PROGRESS","IN_REVIEW","DONE"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors ${statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {s || "All Status"}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-gray-200" />

        <div className="flex gap-2 flex-wrap">
          {["","LOW","MEDIUM","HIGH","URGENT"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium
                transition-colors ${priorityFilter === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              {p || "All Priority"}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {isLoading ? (
          <PageSpinner />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="No tasks found"
            description="Tasks assigned to you will appear here"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4
                  hover:bg-gray-50 transition-colors
                  ${isOverdue(task) ? "border-l-4 border-red-400" : ""}`}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium
                      ${task.status === "DONE"
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                      }`}>
                      {task.title}
                    </p>
                    {isOverdue(task) && (
                      <span className="text-xs bg-red-100 text-red-600
                        px-1.5 py-0.5 rounded font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs
                    text-gray-400">
                    <span>{task.project?.name}</span>
                    {task.deadline && (
                      <span>Due {formatDate(task.deadline)}</span>
                    )}
                    <span>{formatRelative(task.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </AppLayout>
  );
};

export default MyTasks;