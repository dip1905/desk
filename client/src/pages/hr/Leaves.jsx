import { useState }              from "react";
import AppLayout                 from "../../components/layout/AppLayout";
import Modal                     from "../../components/ui/Modal";
import EmptyState                from "../../components/ui/EmptyState";
import { PageSpinner }           from "../../components/ui/Spinner";
import {
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useUpdateLeaveStatusMutation,
  useCancelLeaveMutation,
} from "../../store/api/hrApi";
import { getInitials, formatDate } from "../../utils/formatters";
import useAuth    from "../../hooks/useAuth";
import toast      from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineBadgeCheck,
} from "react-icons/hi";

const getStatusColor = (status) => {
  const colors = {
    PENDING:          "bg-yellow-100 text-yellow-700",
    MANAGER_APPROVED: "bg-blue-100 text-blue-700",
    APPROVED:         "bg-green-100 text-green-700",
    REJECTED:         "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING:          "Pending",
    MANAGER_APPROVED: "Manager Approved",
    APPROVED:         "HR Approved",
    REJECTED:         "Rejected",
  };
  return labels[status] || status;
};

const Leaves = () => {
  const { isManager, user }             = useAuth();
  const isHR = ["SUPER_ADMIN","ADMIN"].includes(user?.role);
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [reviewModal,  setReviewModal]  = useState(null);
  const [reviewAction, setReviewAction] = useState("");

  const { data, isLoading, refetch } = useGetLeavesQuery({
    status: statusFilter || undefined,
  });

  const [applyLeave,        { isLoading: isApplying }] =
    useApplyLeaveMutation();
  const [updateLeaveStatus, { isLoading: isUpdating }] =
    useUpdateLeaveStatusMutation();
  const [cancelLeave] = useCancelLeaveMutation();

  const leaves = data?.data?.leaves || [];

  const [form, setForm] = useState({
    type: "casual", from: "", to: "", reason: "",
  });

  const [reviewNote, setReviewNote] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await applyLeave(form).unwrap();
      toast.success("Leave application submitted");
      setIsModalOpen(false);
      setForm({ type: "casual", from: "", to: "", reason: "" });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to apply leave");
    }
  };

  const handleReview = async () => {
    try {
      await updateLeaveStatus({
        id:         reviewModal.id,
        status:     reviewAction,
        reviewNote: reviewNote,
      }).unwrap();
      toast.success(`Leave ${reviewAction.replace("_"," ").toLowerCase()}`);
      setReviewModal(null);
      setReviewNote("");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await cancelLeave(id).unwrap();
      toast.success("Leave cancelled");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel");
    }
  };

  // What actions can current user take on a leave
  const getAvailableActions = (leave) => {
    const actions = [];

    // Manager can approve pending leaves
    if (user?.role === "MANAGER" && leave.status === "PENDING") {
      actions.push({ label: "Approve", status: "MANAGER_APPROVED", color: "green" });
      actions.push({ label: "Reject",  status: "REJECTED",         color: "red"   });
    }

    // HR can final approve manager approved leaves
    if (isHR && leave.status === "MANAGER_APPROVED") {
      actions.push({ label: "Final Approve", status: "APPROVED",  color: "green" });
      actions.push({ label: "Reject",        status: "REJECTED",  color: "red"   });
    }

    // HR can also reject pending leaves directly
    if (isHR && leave.status === "PENDING") {
      actions.push({ label: "Manager Approve", status: "MANAGER_APPROVED", color: "blue"  });
      actions.push({ label: "Reject",          status: "REJECTED",         color: "red"   });
    }

    return actions;
  };

  return (
    <AppLayout title="Leaves">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Leave Management
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {leaves.length} leave requests
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600
            hover:bg-blue-700 text-white px-4 py-2 rounded-lg
            text-sm font-medium transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Apply Leave
        </button>
      </div>

      {/* Leave Flow Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl
        p-4 mb-4">
        <p className="text-blue-800 text-sm font-semibold mb-2">
          Leave Approval Flow
        </p>
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1
            rounded-full font-medium">Employee Applies</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1
            rounded-full font-medium">Manager Approves</span>
          <span>→</span>
          <span className="bg-green-100 text-green-700 px-2 py-1
            rounded-full font-medium">HR Final Approval</span>
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4 flex gap-2 flex-wrap">
        {[
          { value: "",                 label: "All"              },
          { value: "PENDING",          label: "Pending"          },
          { value: "MANAGER_APPROVED", label: "Manager Approved" },
          { value: "APPROVED",         label: "HR Approved"      },
          { value: "REJECTED",         label: "Rejected"         },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium
              transition-colors ${statusFilter === s.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm">
        {isLoading ? (
          <PageSpinner />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon="🌿"
            title="No leave requests"
            description="Leave requests will appear here"
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {leaves.map((leave) => {
              const actions = getAvailableActions(leave);
              return (
                <div key={leave.id}
                  className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500
                        flex items-center justify-center text-white
                        text-xs font-bold flex-shrink-0">
                        {getInitials(leave.employee?.user?.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {leave.employee?.user?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="capitalize">{leave.type}</span>
                          {" "}leave •{" "}
                          {formatDate(leave.from)} — {formatDate(leave.to)}
                        </p>
                        {leave.reason && (
                          <p className="text-xs text-gray-500 mt-0.5
                            max-w-xs">
                            {leave.reason}
                          </p>
                        )}
                        {leave.reviewNote && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            Note: {leave.reviewNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2
                      flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5
                        rounded-full font-medium
                        ${getStatusColor(leave.status)}`}>
                        {getStatusLabel(leave.status)}
                      </span>

                      {/* Action buttons */}
                      {actions.map((action) => (
                        <button
                          key={action.status}
                          onClick={() => {
                            setReviewModal(leave);
                            setReviewAction(action.status);
                          }}
                          className={`p-1.5 rounded-lg
                            transition-colors text-xs font-medium
                            px-2 py-1
                            ${action.color === "green"
                              ? "bg-green-50 text-green-600 hover:bg-green-100"
                              : action.color === "blue"
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                        >
                          {action.label}
                        </button>
                      ))}

                      {/* Employee cancel */}
                      {leave.employee?.user?.id === user?.id &&
                        leave.status === "PENDING" && (
                        <button
                          onClick={() => handleCancel(leave.id)}
                          className="text-xs text-red-500
                            hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Leave Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({
                ...p, type: e.target.value
              }))}
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="earned">Earned Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">From *</label>
              <input
                type="date" required
                value={form.from}
                onChange={(e) => setForm((p) => ({
                  ...p, from: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">To *</label>
              <input
                type="date" required
                value={form.to}
                onChange={(e) => setForm((p) => ({
                  ...p, to: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Reason *</label>
            <textarea
              required rows={3}
              value={form.reason}
              onChange={(e) => setForm((p) => ({
                ...p, reason: e.target.value
              }))}
              placeholder="Reason for leave..."
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 resize-none"
            />
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
              type="submit" disabled={isApplying}
              className="flex-1 bg-blue-600 hover:bg-blue-700
                disabled:bg-blue-400 text-white px-4 py-2
                rounded-lg text-sm font-medium"
            >
              {isApplying ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      {reviewModal && (
        <Modal
          isOpen={!!reviewModal}
          onClose={() => {
            setReviewModal(null);
            setReviewNote("");
          }}
          title={`${reviewAction === "APPROVED"
            ? "Final Approve"
            : reviewAction === "MANAGER_APPROVED"
              ? "Manager Approve"
              : "Reject"} Leave Request`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-700">
                {reviewModal.employee?.user?.name}
              </p>
              <p className="text-gray-500 mt-0.5">
                <span className="capitalize">{reviewModal.type}</span>
                {" "}leave — {formatDate(reviewModal.from)} to{" "}
                {formatDate(reviewModal.to)}
              </p>
              <p className="text-gray-500 mt-0.5">
                {reviewModal.reason}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium
                text-gray-700 mb-1">
                Review Note (optional)
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Add a note for the employee..."
                className="w-full px-3 py-2 border border-gray-200
                  rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewNote("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200
                  rounded-lg text-sm font-medium text-gray-600
                  hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={isUpdating}
                className={`flex-1 px-4 py-2 rounded-lg text-sm
                  font-medium text-white disabled:opacity-50
                  ${reviewAction === "REJECTED"
                    ? "bg-red-500 hover:bg-red-600"
                    : reviewAction === "MANAGER_APPROVED"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                {isUpdating ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </AppLayout>
  );
};

export default Leaves;