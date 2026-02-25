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

const Slide56VerificationGates = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Verification Gates
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      No cross-agent promotion without evidence.
    </p>
    <div className="grid grid-cols-3 gap-[2%] flex-1 w-full">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center items-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-slate-500 uppercase mb-[2%]">Agent Output</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.85rem)] font-semibold text-slate-800">claim + artifact</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center items-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-amber-700 uppercase mb-[2%]">Local Gate</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.85rem)] font-semibold text-slate-800">schema + acceptance checks</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center items-center text-center">
        <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-emerald-700 uppercase mb-[2%]">Global Promotion</p>
        <p className="text-[clamp(1.2rem,1.6vw,1.85rem)] font-semibold text-slate-800">trusted shared state</p>
      </div>
    </div>
  </BaseSlide>
);

export default Slide56VerificationGates;
