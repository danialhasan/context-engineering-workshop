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

const Slide25ResearchSectionOpener = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[4%] text-indigo-600 uppercase tracking-widest">
      Same Fundamental Problem, Different Constraints
    </h2>
    <div className="flex items-center justify-center gap-[3%] flex-1 w-full">
      <div className="px-[2vw] py-[1.2vw] bg-slate-900 text-white rounded-[1vw] text-[clamp(1.1rem,1.5vw,1.7rem)] font-bold">
        Finite attention + changing state
      </div>
      <ArrowRight className="w-[clamp(1.8rem,2.8vw,3.6rem)] h-[clamp(1.8rem,2.8vw,3.6rem)] text-slate-400" />
      <div className="grid grid-cols-1 gap-[1vh] text-left">
        <div className="px-[1.4vw] py-[0.9vw] bg-indigo-50 border border-indigo-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-indigo-700">Anthropic approach</div>
        <div className="px-[1.4vw] py-[0.9vw] bg-emerald-50 border border-emerald-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-emerald-700">OpenAI approach</div>
        <div className="px-[1.4vw] py-[0.9vw] bg-rose-50 border border-rose-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-rose-700">Manus approach</div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide25ResearchSectionOpener;
