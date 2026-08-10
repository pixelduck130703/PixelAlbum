import { useLocation } from "react-router-dom";
import HomeMusicPlayer from "./HomeMusicPlayer";

function GlobalMusicPlayer() {
  const location = useLocation();

  const pathname = location.pathname;

  const shouldShowMusic =
    pathname === "/" ||
    pathname.startsWith("/person/");

  if (!shouldShowMusic) {
    return null;
  }

  return <HomeMusicPlayer />;
}

export default GlobalMusicPlayer;