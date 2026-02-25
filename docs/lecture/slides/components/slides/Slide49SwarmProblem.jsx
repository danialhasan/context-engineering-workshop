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

const Slide49SwarmProblem = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.3%] text-rose-600 uppercase tracking-widest">
      Swarm Problem
    </h2>
    <p className="text-[clamp(1.5rem,2.15vw,2.5rem)] font-bold text-slate-900 leading-tight max-w-[88%] mx-auto mb-[3.2%]">
      How do multiple agents maintain shared, trustworthy state while acting in parallel?
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
      <div className="h-full grid grid-cols-[30%_8%_1fr] items-center gap-[1%]">
        <div className="flex flex-col gap-[8%]">
          <div className="px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">Agent A write</div>
          <div className="px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">Agent B write</div>
          <div className="px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-white border border-slate-300 text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">Agent C write</div>
        </div>
        <div className="flex flex-col gap-[12%] items-center">
          <div className="w-full h-[2px] bg-red-400" />
          <div className="w-full h-[2px] bg-red-400" />
          <div className="w-full h-[2px] bg-red-400" />
        </div>
        <div className="relative rounded-[0.9vw] bg-emerald-100 border border-emerald-300 h-[56%] flex items-center justify-center text-[clamp(1.1rem,1.45vw,1.7rem)] font-bold text-emerald-800">
          Shared Context Graph
          <AlertTriangle className="absolute -top-[24%] left-[52%] w-[1.9vw] h-[1.9vw] text-red-500" />
          <AlertTriangle className="absolute -bottom-[24%] left-[66%] w-[1.9vw] h-[1.9vw] text-red-500" />
        </div>
      </div>
      <p className="mt-[1.8%] text-[clamp(1rem,1.35vw,1.5rem)] font-semibold text-slate-600 text-center">
        Parallel writes can conflict unless coordination and verification gates are explicit.
      </p>
    </div>
  </BaseSlide>
);

export default Slide49SwarmProblem;
