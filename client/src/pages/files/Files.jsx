import { useState, useRef } from "react";
import AppLayout from "../../components/layout/AppLayout";
import EmptyState from "../../components/ui/EmptyState";
import { PageSpinner } from "../../components/ui/Spinner";
import {
  useGetFilesQuery,
  useUploadFileMutation,
  useDeleteFileMutation,
} from "../../store/api/fileApi";
import {
  formatFileSize,
  formatDate,
  getInitials,
} from "../../utils/formatters";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";
import {
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineDownload,
  HiOutlineDocument,
  HiOutlinePhotograph,
} from "react-icons/hi";

const Files = () => {
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, refetch } = useGetFilesQuery({
    type: typeFilter || undefined,
  });

  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();

  const files = data?.data?.files || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadFile(formData).unwrap();
      toast.success("File uploaded successfully");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Upload failed");
    }

    e.target.value = "";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await deleteFile(id).unwrap();
      toast.success("File deleted");
      refetch();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const getFileIcon = (type) => {
    if (type === "image") {
      return <HiOutlinePhotograph className="text-blue-500 text-xl" />;
    }
    return <HiOutlineDocument className="text-gray-500 text-xl" />;
  };

  return (
    <AppLayout title="Files">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">File Manager</h2>
          <p className="text-gray-500 text-sm mt-0.5">{files.length} files</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              disabled:bg-blue-400 text-white px-4 py-2 rounded-lg
              text-sm font-medium transition-colors"
          >
            <HiOutlineUpload className="text-lg" />
            {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div
        className="bg-white rounded-xl border border-gray-100
        shadow-sm p-4 mb-4 flex gap-2 flex-wrap"
      >
        {["", "image", "pdf", "doc", "xlsx", "zip"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium
              capitalize transition-colors
              ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {t || "All"}
          </button>
        ))}
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <PageSpinner />
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            icon="📁"
            title="No files uploaded"
            description="Upload files to share with your team"
            action={
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2
                  rounded-lg text-sm font-medium"
              >
                Upload File
              </button>
            }
          />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          xl:grid-cols-4 gap-4"
        >
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-xl border border-gray-100
                shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* File Preview */}
              <div
                className="w-full h-32 bg-gray-50 rounded-lg
                flex items-center justify-center mb-3 overflow-hidden"
              >
                {file.type === "image" ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getFileIcon(file.type)}
                    <span className="text-xs text-gray-400 uppercase font-medium">
                      {file.type}
                    </span>
                  </div>
                )}
              </div>

              {/* File Name */}
              <p className="text-sm font-medium text-gray-800 truncate mb-1">
                {file.name}
              </p>

              {/* File Meta */}
              <div
                className="flex items-center justify-between
                text-xs text-gray-400 mb-3"
              >
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Uploader */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full bg-blue-500
                    flex items-center justify-center text-white
                    text-[10px] font-bold"
                  >
                    {getInitials(file.uploader?.name)}
                  </div>
                  <span className="text-xs text-gray-400">
                    {file.uploader?.name?.split(" ")[0]}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    download={file.name}
                    className="p-1.5 text-blue-500 hover:bg-blue-50
                      rounded-lg transition-colors"
                    title="Download"
                  >
                    <HiOutlineDownload className="text-sm" />
                  </a>
                  {(file.uploadedBy === user?.id || isAdmin()) && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50
                        rounded-lg transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Files;
