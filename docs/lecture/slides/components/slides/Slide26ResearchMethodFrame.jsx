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

const Slide26ResearchMethodFrame = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      How We Analyze Each Lab
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same evaluation frame across all three
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">1. Problem framing</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">How each lab states the context failure they had to solve in production.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.5%]">2. Constraints</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Latency, reliability, horizon length, and operational environment.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.5%]">3. Solution pattern</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">The concrete context-engineering moves they used under those constraints.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.5%]">4. What we steal</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Portable design rules we can apply in our own harnesses.</p>
      </div>
    </div>
  </BaseSlide>
);





export default Slide26ResearchMethodFrame;
