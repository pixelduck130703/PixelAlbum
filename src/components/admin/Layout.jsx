import Topbar from "./Topbar";

function Layout({ children, onShowVisits }) {
  return (
    <div className="flex">
      <div className="flex-1 bg-slate-100 min-h-screen">
        {/* Truyền prop onShowVisits xuống Topbar */}
        <Topbar onShowVisits={onShowVisits} />

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;