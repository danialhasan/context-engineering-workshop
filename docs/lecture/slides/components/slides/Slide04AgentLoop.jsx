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

const Slide04AgentLoop = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-slate-900">The Agent Loop</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full max-w-[100%] gap-[1.5vw]">
        <DiagramNode className="flex-1 bg-blue-50 border-blue-300 text-blue-800">Observe</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-purple-50 border-purple-300 text-purple-800">Reason</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-amber-50 border-amber-300 text-amber-800">Act</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-emerald-50 border-emerald-300 text-emerald-800">Verify</DiagramNode>
        <div className="flex flex-col items-center ml-[1vw]">
          <RefreshCw className="w-[clamp(2.5rem,4vw,5rem)] h-[clamp(2.5rem,4vw,5rem)] text-slate-400 animate-[spin_4s_linear_infinite]" />
          <span className="mt-[0.5vw] text-[clamp(1rem,1.5vw,2rem)] font-bold text-slate-500 uppercase tracking-widest">Repeat</span>
        </div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide04AgentLoop;
