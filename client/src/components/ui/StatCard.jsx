const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center
        justify-center`}>
        <Icon className="text-white text-lg" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full
          ${trend >= 0
            ? "text-green-600 bg-green-50"
            : "text-red-500 bg-red-50"
          }`}>
          {trend >= 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default StatCard;