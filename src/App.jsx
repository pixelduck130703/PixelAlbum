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
import HomeMusicPlayer from "./components/HomeMusicPlayer";

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
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;