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

const Slide11FailureAttentionCollapse = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[6%] text-rose-600">Failure Mode: Attention Collapse</h2>
    <div className="flex flex-col justify-center flex-1 w-full max-w-[80%] mx-auto gap-[8%]">
      <div className="flex items-center gap-[4%]">
        <Database className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-slate-400 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-slate-800">Too much context</p>
      </div>
      <div className="flex items-center gap-[4%]">
        <Activity className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-amber-500 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-slate-800">Low signal-to-noise</p>
      </div>
      <div className="flex items-center gap-[4%]">
        <ShieldAlert className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-rose-500 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-rose-600">Quality drops</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide11FailureAttentionCollapse;
