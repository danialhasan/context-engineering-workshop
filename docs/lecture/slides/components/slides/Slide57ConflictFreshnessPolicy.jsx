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

const Slide57ConflictFreshnessPolicy = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Conflict + Freshness Policy
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Resolve contradictions with versioning, confidence, timestamps, TTL.
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm relative">
      <div className="absolute top-[22%] left-[8%] w-[26%] rounded-[0.8vw] bg-rose-50 border border-rose-200 p-[2%]">
        <p className="text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-rose-700">Claim A</p>
        <p className="text-[clamp(0.9rem,1.1vw,1.25rem)] font-semibold text-slate-700">v3, conf 0.62, stale</p>
      </div>
      <div className="absolute top-[50%] left-[8%] w-[26%] rounded-[0.8vw] bg-emerald-50 border border-emerald-200 p-[2%]">
        <p className="text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-emerald-700">Claim B</p>
        <p className="text-[clamp(0.9rem,1.1vw,1.25rem)] font-semibold text-slate-700">v4, conf 0.86, fresh</p>
      </div>
      <div className="absolute top-[38%] left-[42%] w-[16%] h-[16%] rounded-[50%] bg-slate-100 border border-slate-300 flex items-center justify-center text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-slate-700">merge</div>
      <div className="absolute top-[38%] left-[66%] w-[26%] rounded-[0.8vw] bg-indigo-50 border border-indigo-200 p-[2%]">
        <p className="text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-indigo-700">Trusted Latest</p>
        <p className="text-[clamp(0.9rem,1.1vw,1.25rem)] font-semibold text-slate-700">v4 active, v3 expired (TTL)</p>
      </div>
      <div className="absolute top-[30%] left-[34%] w-[8%] h-[2px] bg-slate-400" />
      <div className="absolute top-[58%] left-[34%] w-[8%] h-[2px] bg-slate-400" />
      <div className="absolute top-[46%] left-[58%] w-[8%] h-[2px] bg-slate-400" />
    </div>
  </BaseSlide>
);

export default Slide57ConflictFreshnessPolicy;
