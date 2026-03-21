import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (date) => {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
};

export const formatTime = (date) => {
  if (!date) return "—";
  return format(new Date(date), "hh:mm a");
};

export const formatRelative = (date) => {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
  }).format(amount);
};

export const getRoleBadgeColor = (role) => {
  const colors = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    ADMIN:       "bg-blue-100 text-blue-700",
    MANAGER:     "bg-green-100 text-green-700",
    EMPLOYEE:    "bg-gray-100 text-gray-700",
  };
  return colors[role] || "bg-gray-100 text-gray-700";
};

export const getStatusColor = (status) => {
  const colors = {
    TODO:        "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    IN_REVIEW:   "bg-yellow-100 text-yellow-700",
    DONE:        "bg-green-100 text-green-700",
    PENDING:     "bg-yellow-100 text-yellow-700",
    APPROVED:    "bg-green-100 text-green-700",
    REJECTED:    "bg-red-100 text-red-700",
    PRESENT:     "bg-green-100 text-green-700",
    ABSENT:      "bg-red-100 text-red-700",
    HALF_DAY:    "bg-yellow-100 text-yellow-700",
    ON_LEAVE:    "bg-blue-100 text-blue-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
};

export const getPriorityColor = (priority) => {
  const colors = {
    LOW:    "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-600",
    HIGH:   "bg-orange-100 text-orange-600",
    URGENT: "bg-red-100 text-red-600",
  };
  return colors[priority] || "bg-gray-100 text-gray-600";
};

export const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};