import React from "react";
import { ConfirmProvider } from "./components/ConfirmProvider";
import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import AuroraBackground from "./components/AuroraBackground";
import CinemaExitWatcher from "./components/CinemaExitWatcher";
import Home from "./pages/Home";
import NetworkBrowser from "./pages/NetworkBrowser";
import VideoPlayer from "./pages/VideoPlayer";
import Arcade from "./pages/Arcade";
import Settings from "./pages/Settings";
import Iptv from "./pages/Iptv";

function App() {
  return (
    <ConfirmProvider>
    <div className="App">
      <AuroraBackground />
      <CinemaExitWatcher />
      <div className="app-content">
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/folder/:folderId" element={<NetworkBrowser />} />
            <Route path="/player" element={<VideoPlayer />} />
            <Route path="/arcade" element={<Arcade />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/iptv" element={<Iptv />} />
          </Routes>
        </HashRouter>
      </div>
    </div>
    </ConfirmProvider>
  
  );
}

export default App;
