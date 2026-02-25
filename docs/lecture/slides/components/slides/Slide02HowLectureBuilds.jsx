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

const Slide02HowLectureBuilds = () => (
  <div className="relative w-full h-full p-[5%] z-10 flex flex-col justify-center">
    <h2 className="text-[clamp(2.5rem,3.6vw,4.6rem)] font-bold mb-[1.5%] text-indigo-600 uppercase tracking-widest text-center">
      Table Of Contents
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3.2%]">
      Layer by layer, from fundamentals to swarm implementation
    </p>
    <div className="grid grid-cols-1 gap-[1.3%] w-full max-w-[96%] mx-auto">
      <div className="bg-white/80 border border-slate-200 rounded-[0.9vw] p-[1.8%] shadow-sm flex items-center justify-between">
        <p className="text-[clamp(1.35rem,1.8vw,2.2rem)] font-bold text-slate-900">1. Fundamentals</p>
        <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-semibold text-slate-600">Model vs harness, failure modes, core problem</p>
      </div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-[0.9vw] p-[1.8%] shadow-sm flex items-center justify-between">
        <p className="text-[clamp(1.35rem,1.8vw,2.2rem)] font-bold text-indigo-700">2. Context Engineering Mechanics</p>
        <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-semibold text-slate-700">Ontology, memory, tools, verification, assembly pattern</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[0.9vw] p-[1.8%] shadow-sm flex items-center justify-between">
        <p className="text-[clamp(1.35rem,1.8vw,2.2rem)] font-bold text-emerald-700">3. Industry Research</p>
        <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-semibold text-slate-700">Anthropic, OpenAI, Manus approaches</p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-[0.9vw] p-[1.8%] shadow-sm flex items-center justify-between">
        <p className="text-[clamp(1.35rem,1.8vw,2.2rem)] font-bold text-rose-700">4. Swarm Mechanics</p>
        <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-semibold text-slate-700">Coordination, typed handoffs, shared-state control</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-[0.9vw] p-[1.8%] shadow-sm flex items-center justify-between">
        <p className="text-[clamp(1.35rem,1.8vw,2.2rem)] font-bold text-amber-700">5. Workshop</p>
        <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-semibold text-slate-700">What we build, run, and verify on AWS</p>
      </div>
    </div>
  </div>
);

export default Slide02HowLectureBuilds;
