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

const Slide12FundamentalProblem = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] justify-center text-center">
    <h2 className="text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold mb-[6%] text-indigo-600 uppercase tracking-widest">
      Fundamental Problem
    </h2>
    <p className="text-[clamp(2.2rem,3vw,4rem)] font-bold text-slate-900 leading-tight mb-[6%] max-w-[95%] mx-auto">
      How do we maintain <span className="text-emerald-600">high-signal</span>, <span className="text-emerald-600">trustworthy</span>, <span className="text-emerald-600">actionable context</span> in long-running agent loops under finite attention and changing state?
    </p>
    <div className="w-[10%] h-[4px] bg-slate-300 rounded-full mx-auto mb-[6%]" />
    <p className="text-[clamp(1.5rem,2vw,2.5rem)] font-medium text-slate-600 max-w-[85%] mx-auto leading-relaxed">
      Same root problem for everyone. Different constraints produce different solutions.
    </p>
  </BaseSlide>
);

export default Slide12FundamentalProblem;
