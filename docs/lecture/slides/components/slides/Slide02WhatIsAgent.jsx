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

const Slide02WhatIsAgent = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[80%] text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-indigo-600 uppercase tracking-widest">What Is An Agent?</h2>
    <p className="text-[clamp(2.5rem,4vw,5.5rem)] leading-tight font-semibold text-slate-800 max-w-[90%] mx-auto">
      An agent is a <span className="text-emerald-600">stateful control loop</span> around a <span className="text-rose-600">stateless reasoning model</span>.
    </p>
  </BaseSlide>
);

export default Slide02WhatIsAgent;
