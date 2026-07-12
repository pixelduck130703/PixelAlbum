
import Topbar from "./Topbar";

function Layout({ children }) {
  return (
    <div className="flex">

      <div className="flex-1 bg-slate-100 min-h-screen">

        <Topbar />

        <div className="p-8">

          {children}

        </div>

      </div>

    </div>
  );
}

export default Layout;