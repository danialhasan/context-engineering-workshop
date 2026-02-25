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
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop: Guided Experiments
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      We run controlled experiments on a prebuilt harness.
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-indigo-50 border border-indigo-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.5%]">Experiment 1: single-agent baseline</p>
        <p className="text-[clamp(1.15rem,1.55vw,1.8rem)] text-slate-700 font-medium leading-snug">Agent retrieves context, executes tools, writes artifacts, and verifies claims before promotion.</p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-700 uppercase tracking-wider mb-[1.5%]">Experiment 2: swarm coordination</p>
        <p className="text-[clamp(1.15rem,1.55vw,1.8rem)] text-slate-700 font-medium leading-snug">Agents coordinate through typed tasks, shared graph state, and receipt-backed handoffs.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-700 uppercase tracking-wider mb-[1.5%]">Experiment 3: mutate one control</p>
        <p className="text-[clamp(1.15rem,1.55vw,1.8rem)] text-slate-700 font-medium leading-snug">Change one variable at a time (tool rights, handoff schema, verification strictness, freshness policy) and observe behavior shift.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-amber-700 uppercase tracking-wider mb-[1.5%]">Takeaway</p>
        <p className="text-[clamp(1.15rem,1.55vw,1.8rem)] text-slate-700 font-medium leading-snug">A reusable architecture and an adaptation checklist attendees can apply in their own stack.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide38WorkshopRun;
