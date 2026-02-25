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

const Slide59WorkshopMapping = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      What You&apos;ll Implement
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Concrete swarm mechanics mapped to this workshop stack.
    </p>
    <div className="grid grid-cols-2 gap-[2.2%] flex-1">
      {[
        ['DynamoDB Graph', 'Shared state nodes + typed edges'],
        ['S3 Receipts', 'Evidence artifacts and verification traces'],
        ['Bedrock Agents', 'Role-specific agent execution'],
        ['Tool Contracts', 'Schema-constrained handoffs and actions'],
        ['Verification Gates', 'Promotion only with evidence'],
        ['Leases + Reassign', 'Timeout-safe coordination loop']
      ].map(([title, body]) => (
        <div key={title} className="bg-white/80 border border-slate-200 rounded-[0.9vw] p-[3%] shadow-sm">
          <p className="text-[clamp(1.05rem,1.35vw,1.6rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.2%]">{title}</p>
          <p className="text-[clamp(1.05rem,1.35vw,1.6rem)] font-semibold text-slate-700">{body}</p>
        </div>
      ))}
    </div>
  </BaseSlide>
);

export default Slide59WorkshopMapping;
