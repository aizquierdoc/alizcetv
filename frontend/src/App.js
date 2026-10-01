import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuroraBackground from "./components/AuroraBackground";
import Home from "./pages/Home";
import NetworkBrowser from "./pages/NetworkBrowser";
import VideoPlayer from "./pages/VideoPlayer";
import Arcade from "./pages/Arcade";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="App">
      <AuroraBackground />
      <div className="app-content">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/folder/:folderId" element={<NetworkBrowser />} />
            <Route path="/player" element={<VideoPlayer />} />
            <Route path="/arcade" element={<Arcade />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
