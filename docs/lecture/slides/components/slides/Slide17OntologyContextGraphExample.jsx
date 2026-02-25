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

const Slide17OntologyContextGraphExample = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Ontology Example: Context Graph
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same primitives, different domains
    </p>

    <div className="flex-1 w-full bg-white/70 border border-slate-200 rounded-[1.2vw] p-[3.2%] flex flex-col justify-center gap-[9%]">
      <div className="flex items-center justify-between gap-[1.2%]">
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-indigo-50 border border-indigo-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-indigo-700">Entity: Person</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">owns</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-emerald-700">Entity: Team</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">works_on</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-amber-50 border border-amber-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-amber-700">Entity: Task</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">updates</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-rose-50 border border-rose-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-rose-700">Entity: Artifact</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">verifies</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-sky-50 border border-sky-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-sky-700">Entity: Receipt</p>
        </div>
      </div>

      <p className="text-center text-[clamp(1.1rem,1.5vw,1.8rem)] font-semibold text-slate-700">
        In another company, labels change. The entity + relationship grammar does not.
      </p>
    </div>
  </BaseSlide>
);

export default Slide17OntologyContextGraphExample;
