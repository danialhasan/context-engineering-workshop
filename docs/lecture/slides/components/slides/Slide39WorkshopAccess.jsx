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

const Slide39WorkshopAccess = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop: How Attendees Access It
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Standardized flow to keep setup under ten minutes
    </p>
    <div className="grid grid-cols-2 gap-[2%] flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.55rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.3%]">1. Enter event + get AWS creds</p>
        <p className="text-[clamp(1.05rem,1.35vw,1.55rem)] text-slate-700 font-medium leading-snug">Open workshop link, complete OTP, copy temporary CLI credentials from the event page.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.55rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.3%]">2. Open coding environment</p>
        <p className="text-[clamp(1.05rem,1.35vw,1.55rem)] text-slate-700 font-medium leading-snug">Use Kiro via RDP (recommended) or VS Code URL, then clone workshop repo.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.55rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.3%]">3. Export env + validate</p>
        <p className="text-[clamp(1.05rem,1.35vw,1.55rem)] text-slate-700 font-medium leading-snug">Set `AWS_*` + `CEW_*` env vars, run doctor checks, confirm DynamoDB/S3 access.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.6%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.55rem)] font-bold text-indigo-700 uppercase tracking-wider mb-[1.3%]">4. Run prebuilt lab paths</p>
        <p className="text-[clamp(1.05rem,1.35vw,1.55rem)] text-slate-700 font-medium leading-snug">Run single-agent and swarm flows, inspect internals, then execute guided mutations with verification receipts.</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide39WorkshopAccess;
