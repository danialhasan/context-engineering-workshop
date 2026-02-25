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

const Slide05WhatIsHarness = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-indigo-600 uppercase tracking-widest">What Is A Harness?</h2>
    <div className="flex flex-col gap-[8%] flex-1 justify-center">
      <p className="text-[clamp(2.5rem,4vw,5rem)] font-semibold text-slate-800 leading-tight">
        The harness <span className="text-indigo-600">surrounds</span> the model.
      </p>
      <div className="w-full h-[4px] bg-slate-200 rounded-full" />
      <p className="text-[clamp(2.5rem,4vw,5rem)] font-semibold text-slate-600 leading-tight">
        It provides tools, memory, context management, and safety.
      </p>
    </div>
  </BaseSlide>
);

export default Slide05WhatIsHarness;
