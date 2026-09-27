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
import Invitation2 from "./pages/Invitation2"; // Import Invitation2
import HomeMusicPlayer from "./components/HomeMusicPlayer";
import VideoCreator from './pages/VideoCreator';

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

        {/* Bản thiệp mời 1 */}
        <Route
          path="/invitation"
          element={<Invitation />}
        />

        {/* Bản thiệp mời 2 mới thêm */}
        <Route
          path="/invitation2"
          element={<Invitation2 />}
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/create-video" element={<VideoCreator />} />
      </Routes>
    </>
  );
}

export default App;