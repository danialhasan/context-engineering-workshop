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

const Slide24IndustryResearchTransition = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[3%] text-indigo-600 uppercase tracking-widest">
      Industry Research on Context Engineering
    </h2>
    <p className="text-[clamp(1.6rem,2.2vw,2.7rem)] font-semibold text-slate-800 mb-[4%] max-w-[92%] mx-auto">
      Now we compare how Anthropic, OpenAI, and Manus solved this under different real-world constraints.
    </p>
    <div className="grid grid-cols-3 gap-[2%] w-full">
      <div className="bg-indigo-50 border border-indigo-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-700 mb-[1.5%]">Anthropic</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Long-horizon context reliability</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-700 mb-[1.5%]">OpenAI</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Harness legibility and feedback loops</p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-700 mb-[1.5%]">Manus</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Context hygiene for tool-heavy agents</p>
      </div>
    </div>
  </BaseSlide>
);


export default Slide24IndustryResearchTransition;
