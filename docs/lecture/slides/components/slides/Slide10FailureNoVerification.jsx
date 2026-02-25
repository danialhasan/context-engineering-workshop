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

const Slide10FailureNoVerification = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[10%] text-rose-600">Failure Mode: No Verification Loop</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full gap-[2vw]">
        <DiagramNode>Claim 'Done'</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true} className="relative">
          <XCircle className="absolute -top-[2vw] -right-[2vw] w-[4vw] h-[4vw] text-red-500 bg-white rounded-full shadow-md" />
          No Evidence
        </DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true} className="bg-red-600 border-red-700 text-white shadow-[0_0_2vw_rgba(220,38,38,0.3)]">
          Bad State<br/>Promoted
        </DiagramNode>
      </div>
    </div>
  </BaseSlide>
);

export default Slide10FailureNoVerification;
