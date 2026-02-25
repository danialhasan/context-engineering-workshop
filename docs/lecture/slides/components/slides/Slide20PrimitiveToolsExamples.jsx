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

const Slide20PrimitiveToolsExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Tools"
    examples={[
      "`search_nodes` + `neighbors`: discovery tools for reading relevant context without mutating state.",
      "`create_task` / `list_tasks` for coordination, then `claim_task` / `complete_task` for execution.",
      "`verify_task` + `write_receipt` gate promotion, then `upsert_node` / `link_edge` can update shared memory."
    ]}
  />
);

export default Slide20PrimitiveToolsExamples;
