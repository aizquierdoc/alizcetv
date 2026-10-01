import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Play, Pause, RotateCcw, RotateCw, ArrowLeft, Subtitles,
  AudioLines, Maximize2, Volume2,
} from "lucide-react";
import Focusable from "../components/Focusable";
import GamepadLegend from "../components/GamepadLegend";
import { useFocusEngine } from "../hooks/useFocusEngine";
import { DEMO_VIDEO, aspectRatios } from "../data/mockData";

function fmt(t) {
  if (!isFinite(t)) return "00:00";
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function VideoPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state?.item || {
    title: "Demo · AlizceTV Player",
    subtitle: "Demostración · 1080p",
    audio: ["Español (5.1)", "English (Original)"],
    subs: ["Español", "English"],
  };

  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [showOSD, setShowOSD] = useState(true);
  const [aspect, setAspect] = useState("16:9");
  const [subsOn, setSubsOn] = useState(item.subs?.length > 0);
  const [subTrack, setSubTrack] = useState(item.subs?.[0] || "");
  const [audioTrack, setAudioTrack] = useState(item.audio?.[0] || "");
  const [openMenu, setOpenMenu] = useState(null); // 'aspect' | 'subs' | 'audio'
  const hideTimer = useRef(null);

  const { focusFirst } = useFocusEngine({
    enabled: true,
    onBack: () => {
      if (openMenu) setOpenMenu(null);
      else navigate(-1);
    },
  });

  useEffect(() => {
    const t = setTimeout(focusFirst, 150);
    return () => clearTimeout(t);
  }, [focusFirst]);

  // Auto-hide OSD
  useEffect(() => {
    const resetHide = () => {
      setShowOSD(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowOSD(false), 4500);
    };
    resetHide();
    const events = ["mousemove", "keydown", "mousedown"];
    events.forEach((e) => window.addEventListener(e, resetHide));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetHide));
      clearTimeout(hideTimer.current);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const seek = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.currentTime || 0) + delta, v.duration || 0));
  };

  const onTime = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrent(v.currentTime);
    setDuration(v.duration || 0);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  };

  const aspectCss = aspectRatios.find((a) => a.id === aspect)?.css || "object-contain";
  const hasAudio = item.audio?.length > 0;
  const hasSubs = item.subs?.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      data-testid="player-screen"
    >
      <video
        ref={videoRef}
        src={DEMO_VIDEO}
        autoPlay
        muted
        onTimeUpdate={onTime}
        onLoadedMetadata={onTime}
        className={`absolute inset-0 w-full h-full ${aspectCss}`}
        data-testid="video-element"
      />

      {/* OSD overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showOSD ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        <div className="pointer-events-auto absolute top-0 inset-x-0 p-8 flex items-start justify-between">
          <Focusable
            id="player-back"
            testId="btn-player-back"
            onSelect={() => navigate(-1)}
            className="w-12 h-12 rounded-full glass-strong flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </Focusable>
          <div className="text-right">
            <h2 className="font-title text-2xl lg:text-3xl text-white uppercase tracking-widest">
              {item.title}
            </h2>
            <p className="text-xs font-mono tracking-widest text-slate-300 mt-1">
              {item.subtitle}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 p-8">
          {/* Seek bar */}
          <div className="mb-4 flex items-center gap-4 font-mono text-xs text-slate-300 tracking-widest">
            <span>{fmt(current)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-300 to-indigo-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{fmt(duration)}</span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Focusable
              id="pc-back10"
              testId="btn-back-10"
              onSelect={() => seek(-10)}
              className="w-14 h-14 rounded-full glass-strong flex items-center justify-center text-white"
            >
              <RotateCcw size={20} />
            </Focusable>
            <Focusable
              id="pc-play"
              testId="btn-playpause"
              onSelect={togglePlay}
              className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center text-black shadow-[0_0_30px_rgba(56,189,248,0.8)]"
            >
              {playing ? <Pause size={24} /> : <Play size={24} className="ml-1 fill-black" />}
            </Focusable>
            <Focusable
              id="pc-fwd10"
              testId="btn-fwd-10"
              onSelect={() => seek(10)}
              className="w-14 h-14 rounded-full glass-strong flex items-center justify-center text-white"
            >
              <RotateCw size={20} />
            </Focusable>

            <div className="w-px h-10 bg-white/10 mx-3" />

            <Focusable
              id="pc-aspect"
              testId="btn-aspect"
              onSelect={() => setOpenMenu(openMenu === "aspect" ? null : "aspect")}
              className="h-12 px-4 rounded-full glass-strong flex items-center gap-2 text-white"
            >
              <Maximize2 size={16} />
              <span className="text-xs font-mono tracking-widest uppercase">{aspect}</span>
            </Focusable>

            <Focusable
              id="pc-subs"
              testId="btn-subs"
              onSelect={() => hasSubs && setOpenMenu(openMenu === "subs" ? null : "subs")}
              className={`h-12 px-4 rounded-full glass-strong flex items-center gap-2 ${hasSubs ? "text-white" : "text-slate-600 opacity-50 cursor-not-allowed"}`}
              aria-disabled={!hasSubs}
            >
              <Subtitles size={16} />
              <span className="text-xs font-mono tracking-widest uppercase">
                {hasSubs ? (subsOn ? subTrack : "Desactivado") : "Sin subs"}
              </span>
            </Focusable>

            <Focusable
              id="pc-audio"
              testId="btn-audio"
              onSelect={() => hasAudio && item.audio.length > 1 && setOpenMenu(openMenu === "audio" ? null : "audio")}
              className={`h-12 px-4 rounded-full glass-strong flex items-center gap-2 ${hasAudio && item.audio.length > 1 ? "text-white" : "text-slate-600 opacity-50 cursor-not-allowed"}`}
              aria-disabled={!hasAudio || item.audio.length < 2}
            >
              <AudioLines size={16} />
              <span className="text-xs font-mono tracking-widest uppercase truncate max-w-[220px]">
                {hasAudio ? audioTrack : "Sin audio"}
              </span>
            </Focusable>
          </div>

          {/* Menus */}
          {openMenu === "aspect" && (
            <div className="mt-4 flex justify-center gap-2 flex-wrap" data-testid="menu-aspect">
              {aspectRatios.map((a) => (
                <Focusable
                  key={a.id}
                  id={`asp-${a.id}`}
                  testId={`opt-aspect-${a.id}`}
                  onSelect={() => {
                    setAspect(a.id);
                    setOpenMenu(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase ${aspect === a.id ? "bg-cyan-400 text-black" : "glass-strong text-white"}`}
                >
                  {a.label}
                </Focusable>
              ))}
            </div>
          )}

          {openMenu === "subs" && hasSubs && (
            <div className="mt-4 flex justify-center gap-2 flex-wrap" data-testid="menu-subs">
              <Focusable
                id="sub-off"
                testId="opt-sub-off"
                onSelect={() => { setSubsOn(false); setOpenMenu(null); }}
                className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase ${!subsOn ? "bg-cyan-400 text-black" : "glass-strong text-white"}`}
              >
                Desactivado
              </Focusable>
              {item.subs.map((s, i) => (
                <Focusable
                  key={s}
                  id={`sub-${i}`}
                  testId={`opt-sub-${i}`}
                  onSelect={() => { setSubTrack(s); setSubsOn(true); setOpenMenu(null); }}
                  className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase ${subsOn && subTrack === s ? "bg-cyan-400 text-black" : "glass-strong text-white"}`}
                >
                  {s}
                </Focusable>
              ))}
            </div>
          )}

          {openMenu === "audio" && hasAudio && (
            <div className="mt-4 flex justify-center gap-2 flex-wrap" data-testid="menu-audio">
              {item.audio.map((a, i) => (
                <Focusable
                  key={a}
                  id={`audio-${i}`}
                  testId={`opt-audio-${i}`}
                  onSelect={() => { setAudioTrack(a); setOpenMenu(null); }}
                  className={`px-4 py-2 rounded-full text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${audioTrack === a ? "bg-cyan-400 text-black" : "glass-strong text-white"}`}
                >
                  <Volume2 size={14} /> {a}
                </Focusable>
              ))}
            </div>
          )}
        </div>
      </div>

      <GamepadLegend />
    </div>
  );
}
