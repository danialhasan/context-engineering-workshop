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

const Slide38WorkshopRun = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%]">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop: What We Run
    </h2>
    <p className="text-[clamp(1.12rem,1.6vw,1.9rem)] font-medium text-slate-600 text-center mb-[2.4%]">
      Same harness, two execution modes: single agent then swarm coordination
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-indigo-50 border border-indigo-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.1%]">Mode 1: single agent</p>
        <p className="text-[clamp(1.02rem,1.32vw,1.55rem)] text-slate-700 font-medium leading-snug">Agent retrieves context, executes tools, writes artifacts, and verifies claims before promotion.</p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-rose-700 uppercase tracking-wider mb-[1.1%]">Mode 2: swarm</p>
        <p className="text-[clamp(1.02rem,1.32vw,1.55rem)] text-slate-700 font-medium leading-snug">Agents coordinate through typed tasks, shared graph state, and receipt-backed handoffs.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-emerald-700 uppercase tracking-wider mb-[1.1%]">Execution loop</p>
        <p className="text-[clamp(1.02rem,1.32vw,1.55rem)] text-slate-700 font-medium leading-snug">Observe → retrieve → act → verify → write back. Repeat until completion criteria are proven.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm min-h-0">
        <p className="text-[clamp(0.98rem,1.28vw,1.45rem)] font-bold text-amber-700 uppercase tracking-wider mb-[1.1%]">Output</p>
        <p className="text-[clamp(1.02rem,1.32vw,1.55rem)] text-slate-700 font-medium leading-snug">A working harness pattern attendees can reuse with their own datasets and tools.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide38WorkshopRun;
