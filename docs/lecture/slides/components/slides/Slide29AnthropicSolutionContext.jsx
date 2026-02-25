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

const Slide29AnthropicSolutionContext = () => (
  <ResearchLabSlide
    title="Anthropic: Solution Context"
    subtitle="Solution: Initializer -> coder handoff pattern with explicit artifacts"
    accent="indigo"
    bullets={[
      "Run 0 uses an initializer prompt to scaffold the environment and feature map.",
      "Subsequent runs use coder prompts to deliver one clean increment per window.",
      "Persist handoff artifacts (progress file + git history) to bridge sessions."
    ]}
  />
);

export default Slide29AnthropicSolutionContext;
