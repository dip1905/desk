import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

const AppLayout = ({ children, title }) => {
  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;