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

const Slide03StatefulStateless = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[6%] text-slate-900">Stateless Model, Stateful Agent</h2>
    <div className="flex flex-col gap-[6%] flex-1 justify-center">
      <div className="flex items-center gap-[4%] bg-white/60 p-[4%] rounded-[1.5vw] border border-slate-200 shadow-sm">
        <Brain className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-rose-500 shrink-0" />
        <p className="text-[clamp(2.5rem,4vw,5rem)] font-bold text-slate-900">
          <span className="text-slate-500">Model:</span> inference
        </p>
      </div>
      <div className="flex items-center gap-[4%] bg-indigo-50/80 p-[4%] rounded-[1.5vw] border border-indigo-200 shadow-sm">
        <RefreshCw className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-emerald-600 shrink-0" />
        <p className="text-[clamp(2.5rem,4vw,5rem)] font-bold text-slate-900">
          <span className="text-slate-500">Agent:</span> loop + memory + tools + control
        </p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide03StatefulStateless;
