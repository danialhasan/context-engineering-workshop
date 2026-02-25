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

const Slide36CrossLabSynthesis = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Cross-Lab Synthesis
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Different implementations, same invariants
    </p>
    <div className="grid grid-cols-4 gap-[1.2%] flex-1 min-h-0 text-[clamp(0.95rem,1.15vw,1.3rem)]">
      <div className="bg-slate-100 border border-slate-300 rounded-[0.7vw] p-[3%] font-bold text-slate-700">Invariant</div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-[0.7vw] p-[3%] font-bold text-indigo-700">Anthropic</div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[0.7vw] p-[3%] font-bold text-emerald-700">OpenAI</div>
      <div className="bg-rose-50 border border-rose-200 rounded-[0.7vw] p-[3%] font-bold text-rose-700">Manus</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Ontology</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Task-relevant state framing</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Legible process and roles</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Structured memory semantics</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Memory</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">High-signal curation</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Repo + harness state</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Recitation + updates</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Tools</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Controlled context injection</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Harness-mediated tool loops</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Tool-rich long horizon flows</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Verification</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Keep quality stable over time</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Feedback and legibility loops</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Failure traces as signal</div>
    </div>
  </BaseSlide>
);

export default Slide36CrossLabSynthesis;
