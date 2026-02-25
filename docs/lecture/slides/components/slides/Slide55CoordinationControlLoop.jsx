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

const Slide55CoordinationControlLoop = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Coordination Control Loop
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Queue -&gt; claim -&gt; lease -&gt; timeout -&gt; reassign.
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm relative">
      <div className="absolute top-[38%] left-[5%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-slate-100 border border-slate-300 font-bold text-slate-700">Queue</div>
      <div className="absolute top-[38%] left-[22%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-indigo-50 border border-indigo-200 font-bold text-indigo-700">Claim</div>
      <div className="absolute top-[38%] left-[38%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-amber-50 border border-amber-200 font-bold text-amber-700">Lease</div>
      <div className="absolute top-[38%] left-[55%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-rose-50 border border-rose-200 font-bold text-rose-700">Timeout</div>
      <div className="absolute top-[38%] left-[73%] px-[1vw] py-[0.7vw] rounded-[0.7vw] bg-emerald-50 border border-emerald-200 font-bold text-emerald-700">Reassign</div>
      <div className="absolute top-[45%] left-[15%] w-[7%] h-[2px] bg-slate-400" />
      <div className="absolute top-[45%] left-[31%] w-[7%] h-[2px] bg-slate-400" />
      <div className="absolute top-[45%] left-[48%] w-[7%] h-[2px] bg-slate-400" />
      <div className="absolute top-[45%] left-[66%] w-[7%] h-[2px] bg-slate-400" />
      <div className="absolute top-[58%] left-[78%] w-[2px] h-[12%] bg-slate-400" />
      <div className="absolute top-[70%] left-[12%] w-[66%] h-[2px] bg-slate-400" />
      <div className="absolute top-[58%] left-[12%] w-[2px] h-[12%] bg-slate-400" />
      <p className="absolute top-[72%] left-[33%] text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-600 uppercase tracking-wider">retry loop</p>
    </div>
  </BaseSlide>
);

export default Slide55CoordinationControlLoop;
