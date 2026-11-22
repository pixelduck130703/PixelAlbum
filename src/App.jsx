import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";

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
import VisitorLocationDialog from "./components/VisitorLocationDialog";
import { getVisitorLocationPreference, saveVisitorLocationPreference, clearVisitorLocation, getVisitorLocation, VISITOR_LOCATION_KEY } from "./services/visitorLocation";

function App() {
  const location = useLocation();

  const showMusic =
    location.pathname === "/" ||
    location.pathname.startsWith("/person/");
  const [locationChoice, setLocationChoice] = useState(getVisitorLocationPreference);
  const [reviewLocation, setReviewLocation] = useState(false);

  useEffect(() => {
    const sync = event => {
      if (event.key !== VISITOR_LOCATION_KEY && event.key !== null) return;
      clearVisitorLocation();
      setLocationChoice(getVisitorLocationPreference());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function chooseLocation(choice) {
    clearVisitorLocation();
    const saved = saveVisitorLocationPreference(choice);
    setLocationChoice(saved ? choice : "none");
    setReviewLocation(false);
    if (saved && choice !== "none") void getVisitorLocation({ allowPrompt: true }).catch(() => {});
  }

  const openLocationSettings = () => setReviewLocation(true);

  return (
    <>
      <HomeMusicPlayer visible={showMusic} />
      {showMusic && (locationChoice === null || reviewLocation) && (
        <VisitorLocationDialog currentChoice={locationChoice} review={reviewLocation} onChoose={chooseLocation} onClose={() => reviewLocation ? setReviewLocation(false) : chooseLocation("none")} />
      )}

      <Routes>
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route path="/" element={<Home locationChoice={locationChoice} onReviewLocation={openLocationSettings} />} />

        <Route
          path="/person/:publicId"
          element={<Detail locationChoice={locationChoice} onReviewLocation={openLocationSettings} />}
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
      </Routes>
    </>
  );
}

export default App;
