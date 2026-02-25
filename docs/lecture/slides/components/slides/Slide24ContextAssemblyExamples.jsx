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

const Slide24ContextAssemblyExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Context Assembly (Runtime Pattern)"
    examples={[
      "Read-only discovery subagents fan out, gather evidence fast, and return distilled briefs to a main agent.",
      "A single agent runs retrieval + synthesis before acting when the task is small and latency matters.",
      "Specialized subagents (code, docs, ops) synthesize in parallel; coordinator merges results with receipts."
    ]}
  />
);

export default Slide24ContextAssemblyExamples;
