import React from 'react';
import { BaseSlide, ArrowRight } from '../shared';

const Slide47MechanicsLayeringModel = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.6%] text-indigo-600 uppercase tracking-widest text-center">
      Mechanics Layering Model
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Swarms = single-agent mechanics + coordination overlay
    </p>

    <div className="grid grid-cols-2 gap-[2.4%] flex-1 w-full">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3.2%] shadow-sm">
        <p className="text-[clamp(1.05rem,1.4vw,1.65rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[2.2%]">Base Layer: Single-Agent</p>
        <ul className="list-disc pl-[1.2em] space-y-[1vh] marker:text-indigo-500 text-[clamp(1.1rem,1.45vw,1.75rem)] font-semibold text-slate-800 leading-snug">
          <li>instruction contracts</li>
          <li>runtime retrieval + assembly</li>
          <li>tool contracts + schema checks</li>
          <li>local verification</li>
        </ul>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[3.2%] shadow-sm relative">
        <p className="text-[clamp(1.05rem,1.4vw,1.65rem)] font-bold text-rose-700 uppercase tracking-wider mb-[2.2%]">Overlay: Swarm Coordination</p>
        <ul className="list-disc pl-[1.2em] space-y-[1vh] marker:text-rose-500 text-[clamp(1.1rem,1.45vw,1.75rem)] font-semibold text-slate-800 leading-snug">
          <li>typed handoffs</li>
          <li>role-scoped tool rights</li>
          <li>shared-state topology</li>
          <li>leases + reassign loops</li>
          <li>global promotion gates</li>
          <li>conflict + freshness policy</li>
        </ul>
      </div>
    </div>

    <div className="mt-[2.2%] flex items-center justify-center gap-[1.2%]">
      <ArrowRight className="w-[clamp(1.3rem,1.8vw,2.1rem)] h-[clamp(1.3rem,1.8vw,2.1rem)] text-slate-400" />
      <p className="text-[clamp(1.15rem,1.55vw,1.85rem)] font-bold text-slate-700">Correctness for one loop -&gt; reliability across many parallel loops</p>
    </div>
  </BaseSlide>
);

export default Slide47MechanicsLayeringModel;
