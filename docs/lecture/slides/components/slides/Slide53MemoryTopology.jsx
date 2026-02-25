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

const Slide53MemoryTopology = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Memory Topology
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Local working memory + shared graph + artifact store.
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col gap-[2.5%]">
      <div className="h-[30%] rounded-[0.8vw] bg-indigo-50 border border-indigo-200 flex items-center justify-between px-[3%]">
        <p className="text-[clamp(1.1rem,1.45vw,1.75rem)] font-bold text-indigo-700">Role-local scratchpads</p>
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-semibold text-slate-700">planner | researcher | executor | verifier</p>
      </div>
      <div className="h-[30%] rounded-[0.8vw] bg-emerald-50 border border-emerald-200 flex items-center justify-between px-[3%]">
        <p className="text-[clamp(1.1rem,1.45vw,1.75rem)] font-bold text-emerald-700">Global context graph</p>
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-semibold text-slate-700">shared durable state</p>
      </div>
      <div className="h-[30%] rounded-[0.8vw] bg-amber-50 border border-amber-200 flex items-center justify-between px-[3%]">
        <p className="text-[clamp(1.1rem,1.45vw,1.75rem)] font-bold text-amber-700">Artifact + receipt store</p>
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-semibold text-slate-700">files, traces, verifiable evidence</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide53MemoryTopology;
