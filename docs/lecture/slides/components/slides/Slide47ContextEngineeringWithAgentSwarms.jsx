import React from 'react';
import { BaseSlide } from '../shared';

const Slide47ContextEngineeringWithAgentSwarms = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.3rem,3.3vw,4.4rem)] font-bold mb-[3%] text-indigo-600 uppercase tracking-widest">
      Context Engineering with Agent Swarms
    </h2>
    <p className="text-[clamp(2rem,2.8vw,3.6rem)] font-bold text-slate-900 leading-tight mb-[3.5%] max-w-[92%] mx-auto">
      Same primitives. Higher coordination pressure.
    </p>
    <div className="w-[10%] h-[4px] bg-slate-300 rounded-full mx-auto mb-[3.5%]" />
    <p className="text-[clamp(1.35rem,1.9vw,2.2rem)] font-medium text-slate-700 max-w-[88%] mx-auto leading-relaxed">
      We are not replacing single-agent context engineering. We are layering swarm coordination mechanics on top of it so reliable behavior survives parallel execution.
    </p>
  </BaseSlide>
);

export default Slide47ContextEngineeringWithAgentSwarms;
