'use client';

import * as React from 'react';

export function RadarAnimation() {
  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center bg-emerald-950/20 rounded-full border border-emerald-500/10 shadow-inner overflow-hidden mb-6">
      
      {/* Pulse Rings */}
      <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-4 rounded-full border border-emerald-500/20 animate-ping opacity-15" style={{ animationDuration: '4s', animationDelay: '1s' }} />

      {/* Static Target Crosshair Grid */}
      <svg className="absolute inset-0 w-full h-full text-emerald-500/10 pointer-events-none" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Rotating Sweep Hand */}
      <div
        className="absolute w-[90px] h-[90px] top-[10px] left-[10px] origin-bottom-right pointer-events-none"
        style={{
          transformOrigin: '100% 100%',
          animation: 'radar-sweep 4s linear infinite',
          background: 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.25) 0deg, rgba(16, 185, 129, 0) 90deg)',
          borderRadius: '100% 0 0 0',
        }}
      />

      {/* Pulsing Target Dots (Coop matches detected in space) */}
      <div className="absolute top-[30%] left-[25%] w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" style={{ animationDuration: '2s' }} />
      <div className="absolute top-[60%] right-[35%] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-[25%] left-[45%] w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />

      {/* Center Anchor Point */}
      <div className="relative w-4 h-4 rounded-full bg-emerald-500 border border-white/20 shadow-[0_0_10px_#10b981] flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
      </div>

      <style jsx global>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default RadarAnimation;
