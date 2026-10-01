import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import ContinueWatching from "../components/ContinueWatching";
import StreamingGrid from "../components/StreamingGrid";
import NetworkSources from "../components/NetworkSources";
import ArcadeTile from "../components/ArcadeTile";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { coinopsService, isElectron, systemService } from "../services/alizceApi";

export default function Home() {
  const navigate = useNavigate();
  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => { /* root — never exit */ },
    onMenu: () => navigate("/settings"),
    onMinimize: () => systemService.minimize(),
  });

  useEffect(() => {
    const t = setTimeout(focusFirst, 150);
    return () => clearTimeout(t);
  }, [focusFirst]);

  const openPlayer = (item) => navigate("/player", { state: { item } });
  const openFolder = (folder) => navigate(`/folder/${folder.id}`, { state: { share: folder.share || folder.name } });
  const launchArcade = async () => {
    if (isElectron) {
      const ok = await coinopsService.launch();
      if (!ok) navigate("/arcade");
    } else navigate("/arcade");
  };
  const openIptv = () => navigate("/iptv");

  return (
    <div data-testid="home-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pb-24">
        <ContinueWatching onPlay={openPlayer} />
        <StreamingGrid onOpenIptv={openIptv} />
        <NetworkSources onOpenFolder={openFolder} />
        <ArcadeTile onLaunch={launchArcade} />
      </main>
      <GamepadLegend />
    </div>
  );
}
