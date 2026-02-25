import React from 'react';
import {
  BaseSlide,
  DiagramNode,
  ThickArrow,
  PrimitiveExplainerSlide,
  PrimitiveExamplesSlide,
  ResearchLabSlide,
  ResearchOverviewSlide,
  ResearchDiagramSlide,
  ResearchDiagramPairSlide,
  ResearchImageOnlySlide,
  ArrowRight,
  RefreshCw,
  Brain,
  Database,
  Activity,
  ShieldAlert,
  HelpCircle,
  XCircle,
  AlertTriangle,
  Terminal,
  Eye,
  Zap,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  openaiObservabilityStack,
  openaiDevtoolsValidationLoop,
  openaiLimitsOfAgentKnowledge,
  openaiLayeredDomainArchitecture,
  anthropicSessionHandoffNanobanana,
  anthropicInitializerCoderNanobanana,
  manusKvCache,
  manusMaskDontRemove,
  manusFileSystemContext,
  manusKeepWrongStuff,
  manusRecitation,
  manusDontGetFewShotted
} from '../shared';

const Slide48SwarmSingleToSwarm = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Single Agent -&gt; Swarm
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same context-engineering theory, higher coordination pressure.
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1 w-full">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1rem,1.4vw,1.6rem)] font-bold text-slate-500 uppercase tracking-wider mb-[3%]">Single Agent Loop</p>
        <div className="flex flex-col gap-[3%]">
          <DiagramNode className="bg-blue-50 border-blue-300 text-blue-800">Observe</DiagramNode>
          <DiagramNode className="bg-purple-50 border-purple-300 text-purple-800">Reason</DiagramNode>
          <DiagramNode className="bg-amber-50 border-amber-300 text-amber-800">Act</DiagramNode>
          <DiagramNode className="bg-emerald-50 border-emerald-300 text-emerald-800">Verify</DiagramNode>
        </div>
      </div>
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-[1vw] p-[3%] shadow-sm relative">
        <p className="text-[clamp(1rem,1.4vw,1.6rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[3%]">4-Agent Coordination</p>
        <div className="relative h-[90%]">
          <div className="absolute top-[20%] left-[48%] w-[2px] h-[22%] bg-slate-400 z-0" />
          <div className="absolute top-[42%] left-[24%] w-[14%] h-[2px] bg-slate-400 z-0" />
          <div className="absolute top-[42%] right-[24%] w-[14%] h-[2px] bg-slate-400 z-0" />
          <div className="absolute bottom-[24%] left-[48%] w-[2px] h-[18%] bg-slate-400 z-0" />

          <div className="absolute top-[6%] left-[42%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.9rem,1.2vw,1.35rem)] font-bold text-slate-800 z-10">Agent A</div>
          <div className="absolute top-[35%] left-[10%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.9rem,1.2vw,1.35rem)] font-bold text-slate-800 z-10">Agent B</div>
          <div className="absolute top-[35%] right-[10%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.9rem,1.2vw,1.35rem)] font-bold text-slate-800 z-10">Agent C</div>
          <div className="absolute bottom-[8%] left-[42%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.9rem,1.2vw,1.35rem)] font-bold text-slate-800 z-10">Agent D</div>
          <div className="absolute top-[44%] left-[36%] w-[28%] h-[16%] rounded-[0.8vw] bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[clamp(0.9rem,1.2vw,1.35rem)] font-bold text-emerald-800 z-10">Shared Graph</div>
        </div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide48SwarmSingleToSwarm;
