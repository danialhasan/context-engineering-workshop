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

const Slide08FailureUnclearState = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[10%] text-rose-600">Failure Mode: Unclear State</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full gap-[2vw]">
        <DiagramNode>Task</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true}>Missing/Conflicting<br/>State</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true}>Wrong Action</DiagramNode>
      </div>
    </div>
  </BaseSlide>
);

export default Slide08FailureUnclearState;
