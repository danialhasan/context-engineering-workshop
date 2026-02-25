import React from 'react';
import { BaseSlide, ArrowRight } from '../shared';

const Slide47SwarmTrustBoundaries = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.6%] text-indigo-600 uppercase tracking-widest text-center">
      Trust Boundaries in Swarms
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Local done is not global trusted state.
    </p>

    <div className="grid grid-cols-3 gap-[2%] flex-1 w-full">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-slate-500 uppercase mb-[1.8%]">Agent Local</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.9rem)] font-semibold text-slate-800">claim + artifact</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-amber-700 uppercase mb-[1.8%]">Promotion Gate</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.9rem)] font-semibold text-slate-800">verify evidence + policy checks</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-emerald-700 uppercase mb-[1.8%]">Global Shared</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.9rem)] font-semibold text-slate-800">trusted state for all agents</p>
      </div>
    </div>

    <div className="mt-[2.2%] flex items-center justify-center gap-[1.1%]">
      <ArrowRight className="w-[clamp(1.3rem,1.8vw,2.1rem)] h-[clamp(1.3rem,1.8vw,2.1rem)] text-slate-400" />
      <p className="text-[clamp(1.1rem,1.45vw,1.75rem)] font-bold text-slate-700">No cross-agent promotion without evidence.</p>
    </div>
  </BaseSlide>
);

export default Slide47SwarmTrustBoundaries;
