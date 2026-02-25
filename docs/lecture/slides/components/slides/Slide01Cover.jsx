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

const Slide01Cover = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[calc(85%+40px)] h-[80%] items-center text-center">
    <h1 className="text-[clamp(4rem,6vw,8rem)] font-bold leading-[1.1] tracking-tight mb-[3%] text-slate-900">
      Context Engineering for <br/>Agent Swarms
    </h1>
    <p className="text-[clamp(1.8rem,3vw,4rem)] text-slate-500 font-semibold tracking-wide uppercase">
      applied research in multi agent systems
    </p>
  </BaseSlide>
);

export default Slide01Cover;
