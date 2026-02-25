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

const Slide13Primitives = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[90%] justify-center text-center border-indigo-200 bg-indigo-50/50">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[6%] text-slate-500 uppercase tracking-widest">Primitives</h2>
    <p className="text-[clamp(2.5rem,3.5vw,5rem)] font-semibold text-slate-900 leading-[1.3] mb-[6%]">
      Primitives of context engineering systems
    </p>
    <div className="flex flex-wrap justify-center gap-[2vw] text-[clamp(2.5rem,3.5vw,5rem)] font-bold text-indigo-700">
      {['ontology', 'memory', 'tools', 'verification'].map(word => (
        <span key={word} className="bg-indigo-100/80 px-[2vw] py-[1vw] rounded-[1vw] border border-indigo-200 shadow-sm">
          {word}
        </span>
      ))}
    </div>
  </BaseSlide>
);

export default Slide13Primitives;
