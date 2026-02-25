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

const Slide07WhyThisMatters = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[80%] text-center border-emerald-300 bg-emerald-50/50">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-emerald-600 uppercase tracking-widest">Why This Matters</h2>
    <p className="text-[clamp(3rem,4.5vw,6rem)] leading-[1.2] font-bold text-slate-900 max-w-[90%] mx-auto">
      Most agent failures are not model failures.
      <br/><br/>
      They are <span className="text-emerald-600">context failures.</span>
    </p>
  </BaseSlide>
);

export default Slide07WhyThisMatters;
