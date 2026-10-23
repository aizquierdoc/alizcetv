import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import StreamingGrid from "../components/StreamingGrid";
import NetworkSources from "../components/NetworkSources";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { systemService } from "../services/alizceApi";

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

  const openFolder = (folder) => navigate(`/folder/${folder.id}`, { state: { share: folder.share || folder.name } });

  const openIptv = () => navigate("/iptv");

  return (
    <div data-testid="home-screen">
      <TopBar />
      <main className="relative px-10 lg:px-14 pb-24">
        <NetworkSources onOpenFolder={openFolder} />
        <StreamingGrid onOpenIptv={openIptv} />
      </main>
    </div>
  );
}
