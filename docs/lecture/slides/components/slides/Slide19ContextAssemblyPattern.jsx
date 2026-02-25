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

const Slide19ContextAssemblyPattern = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2rem,2.8vw,3.5rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Context Assembly (Runtime Pattern)
    </h2>
    <div className="flex flex-1 gap-[3%] min-h-0 w-full">
      <div className="flex-1 bg-white/80 border border-slate-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col overflow-y-auto">
        <p className="text-[clamp(1rem,1.35vw,1.65rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[2%]">
          Definition
        </p>
        <p className="text-[clamp(1.7rem,2.2vw,2.9rem)] font-bold text-slate-900 leading-tight">
          Agent behavior that selects and distills next-step context at runtime.
        </p>
      </div>
      <div className="flex-1 bg-indigo-50/70 border border-indigo-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col overflow-y-auto">
        <p className="text-[clamp(1rem,1.35vw,1.65rem)] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-[2%]">
          Familiar mental model
        </p>
        <p className="text-[clamp(1.7rem,2.2vw,2.9rem)] font-bold text-slate-900 leading-tight mb-[2%]">
          Like researchers briefing a decision maker before a meeting.
        </p>
        <p className="text-[clamp(1.2rem,1.6vw,2rem)] font-medium text-slate-700 leading-snug">
          The context system provides access and guardrails. The agent or subagents assemble what matters for the next action.
        </p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide19ContextAssemblyPattern;
