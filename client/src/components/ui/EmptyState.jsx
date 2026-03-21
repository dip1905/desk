const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center
      justify-center mb-4 text-3xl">
      {icon || "📭"}
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-gray-400 mb-4 max-w-sm">
        {description}
      </p>
    )}
    {action && action}
  </div>
);

export default EmptyState;