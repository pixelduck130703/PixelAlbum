import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/admin/Login";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import Invitation from "./pages/Invitation";
import Invitation2 from "./pages/Invitation2";
import Invitation3 from "./pages/Invitation3";
import HomeMusicPlayer from "./components/HomeMusicPlayer";
import VideoCreator from "./pages/VideoCreator";
import ImageDescriber from "./pages/ImageDescriber";
import NewYear2027 from "./pages/NewYear2027";
import SalesDashboard from "./pages/SalesDashboard";

function App() {
  const location = useLocation();

  const showMusic =
    location.pathname === "/" ||
    location.pathname.startsWith("/person/");

  return (
    <>
      <HomeMusicPlayer visible={showMusic} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/person/:publicId"
          element={<Detail />}
        />

        <Route
          path="/admin/login"
          element={<Login />}
        />

        <Route
          path="/invitation"
          element={<Invitation />}
        />

        <Route
          path="/invitation2"
          element={<Invitation2 />}
        />

        <Route
          path="/invitation3"
          element={<Invitation3 />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-video"
          element={<VideoCreator />}
        />

        <Route
          path="/image-describer"
          element={<ImageDescriber />}
        />

        <Route
          path="/new-year-2027"
          element={<NewYear2027 />}
        />

        <Route
          path="/sales-dashboard"
          element={
              <SalesDashboard />
          }
        />
      </Routes>
    </>
  );
}

export default App;