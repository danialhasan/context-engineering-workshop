import React from 'react';
import { ArrowRight } from './icons';

export const GlassPanel = ({ children, className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-[2vw] border border-white/60 shadow-xl shadow-slate-900/5 backdrop-blur-[24px] backdrop-saturate-[1.4] bg-white/50 ${className}`}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9)_0%,transparent_60%)] pointer-events-none" />
    <div className="relative z-10 w-full h-full p-[5%] flex flex-col justify-center">{children}</div>
  </div>
);

export const BaseSlide = ({ children, containerClassName = 'flex-col', panelClassName = 'w-full h-full' }) => (
  <div className={`relative w-full h-full p-[5%] z-10 flex ${containerClassName}`}>
    <GlassPanel className={panelClassName}>{children}</GlassPanel>
  </div>
);

export const DiagramNode = ({ children, isError = false, className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center px-[2vw] py-[1.5vw] rounded-[1vw] border-[3px] font-bold text-[clamp(1.2rem,2vw,2.5rem)] leading-tight text-center shadow-sm ${
      isError ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white/80 border-slate-300 text-slate-800'
    } ${className}`}
  >
    {children}
  </div>
);

export const ThickArrow = () => (
  <ArrowRight className="w-[clamp(2rem,4vw,5rem)] h-[clamp(2rem,4vw,5rem)] text-slate-400 stroke-[3px] shrink-0" />
);
