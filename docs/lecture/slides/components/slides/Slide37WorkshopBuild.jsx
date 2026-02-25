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

const Slide37WorkshopBuild = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%]">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop: What We Build
    </h2>
    <p className="text-[clamp(1.12rem,1.6vw,1.9rem)] font-medium text-slate-600 text-center mb-[2.4%]">
      Concrete implementation mapping for the workshop.
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.1%]">State and memory</p>
        <p className="text-[clamp(1.08rem,1.45vw,1.7rem)] text-slate-700 font-medium leading-snug">Graph nodes and edges in DynamoDB to persist durable agent context.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.1%]">Artifacts and receipts</p>
        <p className="text-[clamp(1.08rem,1.45vw,1.7rem)] text-slate-700 font-medium leading-snug">Verification evidence and logs in S3, linked back into graph state.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.1%]">Tool layer</p>
        <p className="text-[clamp(1.08rem,1.45vw,1.7rem)] text-slate-700 font-medium leading-snug">Allowlisted, role-aware skills exposed to agents for retrieval, coordination, and verification.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.1%]">Runtime assembly</p>
        <p className="text-[clamp(1.08rem,1.45vw,1.7rem)] text-slate-700 font-medium leading-snug">Agents and subagents assemble context at runtime using the system&apos;s primitives.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide37WorkshopBuild;
