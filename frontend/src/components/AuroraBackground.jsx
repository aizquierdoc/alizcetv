import React, { useMemo } from "react";

export default function AuroraBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 18 + Math.random() * 18,
        size: 1 + Math.random() * 3,
        hue: Math.random() > 0.5 ? "rgba(125, 211, 252, 0.7)" : "rgba(167, 139, 250, 0.6)",
      })),
    []
  );
  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              bottom: `-5vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.hue,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              boxShadow: `0 0 10px ${p.hue}`,
            }}
          />
        ))}
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
