"use client";

import React, { useState } from"react";
import { Badge } from"@/components/ui";

export const HandAnalysisVisual: React.FC = () => {
  // Hand skeleton connections (wrist to tips)
  const connections = [
    // Thumb
    [50, 76, 39, 64], [39, 64, 32, 54], [32, 54, 25, 43], [25, 43, 20, 33],
    // Index
    [50, 76, 45, 49], [45, 49, 44, 37], [44, 37, 43, 27], [43, 27, 43, 19],
    // Middle
    [50, 76, 52, 48], [52, 48, 53, 34], [53, 34, 54, 24], [54, 24, 54, 15],
    // Ring
    [50, 76, 59, 49], [59, 49, 62, 38], [62, 38, 64, 28], [64, 28, 66, 20],
    // Pinky
    [50, 76, 66, 52], [66, 52, 71, 44], [71, 44, 74, 38], [74, 38, 77, 32],
    // Knuckle connections
    [45, 49, 52, 48], [52, 48, 59, 49], [59, 49, 66, 52]
  ];

  // The 21 exact dots
  const points = [
    [50, 76], // Wrist
    [39, 64], [32, 54], [25, 43], [20, 33], // Thumb
    [45, 49], [44, 37], [43, 27], [43, 19], // Index
    [52, 48], [53, 34], [54, 24], [54, 15], // Middle
    [59, 49], [62, 38], [64, 28], [66, 20], // Ring
    [66, 52], [71, 44], [74, 38], [77, 32], // Pinky
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto bg-[#F7FAF9] rounded-[32px] p-6 pb-6 sm:p-8 sm:pb-8 shadow-sm border border-white/40">
      
      {/* We add global keyframes directly in a style tag for convenience */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(8px, -12px) scale(1.1); }
          66% { transform: translate(-6px, 10px) scale(0.9); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-10px, -15px) scale(1.15); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(12px, 8px) scale(0.85); }
        }
        .animate-float-1 { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-2 { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-3 { animation: float-fast 4s ease-in-out infinite; }
      `}} />

      {/* SVG Canvas Area */}
      <div className="aspect-square w-full relative overflow-hidden flex items-center justify-center">
        <svg className="w-[100%] h-[100%]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          
          <defs>
            <filter id="blur-glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
            <filter id="blur-glow-light" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          
          {/* Animated Yellow Heat Dots */}
          {/* We wrap them in <g> to apply CSS animations smoothly without disturbing SVG coords */}
          <g className="animate-float-1" style={{ transformOrigin: '22px 42px' }}>
            <circle cx="22" cy="42" r="5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.7" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '30px 56px' }}>
            <circle cx="30" cy="56" r="6" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.8" />
          </g>
          <g className="animate-float-3" style={{ transformOrigin: '38px 70px' }}>
            <circle cx="38" cy="70" r="5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.6" />
          </g>
          <g className="animate-float-1" style={{ transformOrigin: '45px 78px' }}>
            <circle cx="45" cy="78" r="6.5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.9" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '54px 83px' }}>
            <circle cx="54" cy="83" r="5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.5" />
          </g>
          <g className="animate-float-3" style={{ transformOrigin: '65px 63px' }}>
            <circle cx="65" cy="63" r="6" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.8" />
          </g>
          <g className="animate-float-1" style={{ transformOrigin: '84px 68px' }}>
            <circle cx="84" cy="68" r="6.5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.75" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '86px 54px' }}>
            <circle cx="86" cy="54" r="5.5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.6" />
          </g>
          <g className="animate-float-3" style={{ transformOrigin: '82px 42px' }}>
            <circle cx="82" cy="42" r="5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.8" />
          </g>
          <g className="animate-float-1" style={{ transformOrigin: '78px 34px' }}>
            <circle cx="78" cy="34" r="6" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.85" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '67px 44px' }}>
            <circle cx="67" cy="44" r="5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.7" />
          </g>
          <g className="animate-float-3" style={{ transformOrigin: '83px 26px' }}>
            <circle cx="83" cy="26" r="6" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.65" />
          </g>
          <g className="animate-float-1" style={{ transformOrigin: '64px 30px' }}>
            <circle cx="64" cy="30" r="5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.6" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '50px 24px' }}>
            <circle cx="50" cy="24" r="5.5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.75" />
          </g>
          <g className="animate-float-3" style={{ transformOrigin: '46px 30px' }}>
            <circle cx="46" cy="30" r="4.5" fill="#f5c45b" filter="url(#blur-glow-light)" opacity="0.8" />
          </g>
          <g className="animate-float-1" style={{ transformOrigin: '45px 37px' }}>
            <circle cx="45" cy="37" r="5" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.65" />
          </g>
          <g className="animate-float-2" style={{ transformOrigin: '59px 16px' }}>
            <circle cx="59" cy="16" r="6" fill="#f5c45b" filter="url(#blur-glow-heavy)" opacity="0.8" />
          </g>
          
          {/* Lines (Light Mint-Teal) */}
          {connections.map((c, idx) => (
            <line
              key={`line-${idx}`}
              x1={c[0]}
              y1={c[1]}
              x2={c[2]}
              y2={c[3]}
              stroke="#A7CBC6"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          ))}

          {/* Dots (Dark Teal) */}
          {points.map((pt, idx) => (
            <circle key={`pt-${idx}`} cx={pt[0]} cy={pt[1]} r="1.3" fill="#0F766E" />
          ))}

          {/* Special Orange tip dot on middle finger (near index) as in image */}
          <circle cx={58.5} cy={16.5} r="1" fill="#f5c45b" />
        </svg>
      </div>

      {/* Bottom Labels */}
      <div className="mt-2 flex items-center justify-between pb-2 px-2">
        <span className="text-[11px] font-bold text-gray-500 tracking-wider">21 LANDMARKS TRACKED</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5c45b]"></span>
          <span className="text-sm font-semibold text-[#0F766E]">Live</span>
        </div>
      </div>
    </div>
  );
};
