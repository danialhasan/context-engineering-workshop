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

const Slide58SwarmRuntimeLoop = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Swarm Runtime Loop
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      plan -&gt; assign -&gt; execute -&gt; verify -&gt; merge -&gt; replan
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm flex items-center justify-center">
      <div className="w-full max-w-[94%]">
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-[1.4%] items-center">
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">plan</div>
          <ArrowRight className="w-[1.5vw] h-[1.5vw] text-slate-400 shrink-0" />
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">assign</div>
          <ArrowRight className="w-[1.5vw] h-[1.5vw] text-slate-400 shrink-0" />
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">execute</div>
        </div>

        <div className="flex items-center justify-end my-[2.2%]">
          <div className="w-[2px] h-[2.2vh] bg-slate-400" />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-[1.4%] items-center">
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">replan</div>
          <ArrowRight className="w-[1.5vw] h-[1.5vw] text-slate-400 shrink-0 rotate-180" />
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">merge</div>
          <ArrowRight className="w-[1.5vw] h-[1.5vw] text-slate-400 shrink-0 rotate-180" />
          <div className="rounded-[0.7vw] border border-slate-300 bg-slate-50 px-[0.8vw] py-[1vw] text-center text-[clamp(0.95rem,1.2vw,1.35rem)] font-bold text-slate-800">verify</div>
        </div>

        <div className="mt-[2.4%] text-center text-[clamp(1rem,1.25vw,1.45rem)] font-semibold text-slate-600">
          Closed loop with feedback into planning and shared memory.
        </div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide58SwarmRuntimeLoop;
