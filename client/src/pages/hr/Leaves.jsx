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
import { getInitials, getStatusColor, formatDate } from "../../utils/formatters";
import useAuth   from "../../hooks/useAuth";
import toast     from "react-hot-toast";
import {
  HiOutlinePlus, HiOutlineCheck, HiOutlineX,
} from "react-icons/hi";

const Leaves = () => {
  const { isManager, user }             = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [reviewModal,  setReviewModal]  = useState(null);

  const { data, isLoading, refetch } = useGetLeavesQuery({
    status: statusFilter || undefined,
  });

  const [applyLeave,        { isLoading: isApplying }]  =
    useApplyLeaveMutation();
  const [updateLeaveStatus, { isLoading: isUpdating }]  =
    useUpdateLeaveStatusMutation();
  const [cancelLeave] = useCancelLeaveMutation();

  const leaves = data?.data?.leaves || [];

  const [form, setForm] = useState({
    type: "casual", from: "", to: "", reason: "",
  });

  const [reviewForm, setReviewForm] = useState({
    status: "", reviewNote: "",
  });

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

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await updateLeaveStatus({
        id:         reviewModal.id,
        status:     reviewForm.status,
        reviewNote: reviewForm.reviewNote,
      }).unwrap();
      toast.success(`Leave ${reviewForm.status.toLowerCase()}`);
      setReviewModal(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
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
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
            text-white px-4 py-2 rounded-lg text-sm font-medium
            transition-colors"
        >
          <HiOutlinePlus className="text-lg" />
          Apply Leave
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4 flex gap-3">
        {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium
              transition-colors ${statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
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
            {leaves.map((leave) => (
              <div key={leave.id}
                className="flex items-center justify-between p-4
                  hover:bg-gray-50 transition-colors">

                <div className="flex items-center gap-3">
                  {/* Avatar */}
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
                      <p className="text-xs text-gray-500 mt-0.5 max-w-xs
                        truncate">
                        {leave.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full
                    font-medium ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>

                  {/* Manager actions */}
                  {isManager() && leave.status === "PENDING" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setReviewModal(leave);
                          setReviewForm({
                            status: "APPROVED", reviewNote: ""
                          });
                        }}
                        className="p-1.5 text-green-500 hover:bg-green-50
                          rounded-lg transition-colors"
                        title="Approve"
                      >
                        <HiOutlineCheck className="text-base" />
                      </button>
                      <button
                        onClick={() => {
                          setReviewModal(leave);
                          setReviewForm({
                            status: "REJECTED", reviewNote: ""
                          });
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50
                          rounded-lg transition-colors"
                        title="Reject"
                      >
                        <HiOutlineX className="text-base" />
                      </button>
                    </div>
                  )}

                  {/* Employee cancel */}
                  {leave.employee?.user?.id === user?.id &&
                    leave.status === "PENDING" && (
                    <button
                      onClick={() => handleCancel(leave.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </div>
            ))}
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
      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={`${reviewForm.status === "APPROVED"
          ? "Approve" : "Reject"} Leave Request`}
      >
        <form onSubmit={handleReview} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-medium text-gray-700">
              {reviewModal?.employee?.user?.name}
            </p>
            <p className="text-gray-500 mt-0.5">
              <span className="capitalize">{reviewModal?.type}</span>
              {" "}leave — {formatDate(reviewModal?.from)} to{" "}
              {formatDate(reviewModal?.to)}
            </p>
            <p className="text-gray-500 mt-0.5">{reviewModal?.reason}</p>
          </div>

          <div>
            <label className="block text-sm font-medium
              text-gray-700 mb-1">Review Note (optional)</label>
            <textarea
              rows={3}
              value={reviewForm.reviewNote}
              onChange={(e) => setReviewForm((p) => ({
                ...p, reviewNote: e.target.value
              }))}
              placeholder="Add a note for the employee..."
              className="w-full px-3 py-2 border border-gray-200
                rounded-lg text-sm focus:outline-none
                focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setReviewModal(null)}
              className="flex-1 px-4 py-2 border border-gray-200
                rounded-lg text-sm font-medium text-gray-600
                hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isUpdating}
              className={`flex-1 px-4 py-2 rounded-lg text-sm
                font-medium text-white disabled:opacity-50
                ${reviewForm.status === "APPROVED"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
                }`}
            >
              {isUpdating
                ? "Processing..."
                : reviewForm.status === "APPROVED"
                  ? "Approve Leave"
                  : "Reject Leave"
              }
            </button>
          </div>

        </form>
      </Modal>

    </AppLayout>
  );
};

export default Leaves;