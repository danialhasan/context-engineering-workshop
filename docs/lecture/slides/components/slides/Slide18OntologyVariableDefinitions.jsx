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

const Slide18OntologyVariableDefinitions = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[80%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Define The Variables
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same ontology shape, domain-specific labels
    </p>

    <div className="grid grid-cols-2 gap-[2.5%] h-[50vh] overflow-y-auto pr-[0.6%] pb-[10%]">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">Person</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The actor who initiates or owns work.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.5%]">Team</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The coordination boundary for shared goals.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.5%]">Task</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">A unit of work with objective and completion criteria.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.5%]">Artifact</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The output produced by task execution.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm col-span-2">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-sky-600 uppercase tracking-wider mb-[1.5%]">Receipt</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">Verification evidence that determines whether an artifact can be trusted and promoted.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide18OntologyVariableDefinitions;
