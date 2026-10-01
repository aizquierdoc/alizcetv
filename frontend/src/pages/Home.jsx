import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ContinueWatching from "../components/ContinueWatching";
import StreamingGrid from "../components/StreamingGrid";
import NetworkSources from "../components/NetworkSources";
import ArcadeTile from "../components/ArcadeTile";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";

export default function Home() {
  const navigate = useNavigate();
  const { focusFirst } = useFocusEngine({ enabled: true });

  useEffect(() => {
    const t = setTimeout(focusFirst, 150);
    return () => clearTimeout(t);
  }, [focusFirst]);

  const openPlayer = (item) => {
    navigate("/player", { state: { item } });
  };
  const openFolder = (folder) => {
    navigate(`/folder/${folder.id}`);
  };
  const launchArcade = () => {
    navigate("/arcade");
  };

  return (
    <div data-testid="home-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pb-24">
        <ContinueWatching onPlay={openPlayer} />
        <StreamingGrid />
        <NetworkSources onOpenFolder={openFolder} />
        <ArcadeTile onLaunch={launchArcade} />
      </main>
      <GamepadLegend />
    </div>
  );
}
