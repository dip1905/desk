const Spinner = ({ size = "md", color = "blue" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div className={`
      ${sizes[size]} rounded-full
      border-gray-200 border-t-${color}-500
      animate-spin
    `} />
  );
};

export const PageSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size="lg" />
  </div>
);

export default Spinner;