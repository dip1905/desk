import { useEffect } from "react";
import { HiX }       from "react-icons/hi";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-xl w-full ${sizes[size]}
        max-h-[90vh] overflow-y-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6
          border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiX className="text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;