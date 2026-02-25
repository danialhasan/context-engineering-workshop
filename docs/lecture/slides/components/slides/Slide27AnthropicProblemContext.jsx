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

const Slide27AnthropicProblemContext = () => (
  <ResearchLabSlide
    title="Anthropic: Problem Context"
    subtitle="Problem: Long-running work breaks across discrete context windows"
    accent="indigo"
    bullets={[
      "Each new session starts with no memory of prior work, so continuity resets.",
      "Agents overreach and attempt one-shot builds, leaving half-finished state.",
      "Later sessions may wrongly declare done without true end-to-end completion."
    ]}
  />
);

export default Slide27AnthropicProblemContext;
