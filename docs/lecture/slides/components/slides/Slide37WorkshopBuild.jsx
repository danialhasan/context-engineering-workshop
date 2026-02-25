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
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop: Prebuilt System
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      We start from a fully implemented harness and inspect internals.
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">State and memory</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Graph nodes and edges in DynamoDB to persist durable agent context.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.5%]">Artifacts and receipts</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Verification evidence and logs in S3, linked back into graph state.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.5%]">Tool layer</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Allowlisted, role-aware tools for retrieval, coordination, and verification.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.5%]">Runtime assembly</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Agents and subagents assemble context at runtime using the system&apos;s primitives.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide37WorkshopBuild;
