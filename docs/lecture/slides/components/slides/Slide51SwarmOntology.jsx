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

const Slide51SwarmOntology = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Swarm Ontology
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Shared meaning for multi-agent coordination.
    </p>
    <div className="w-full flex-1 bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm flex flex-col justify-center gap-[10%]">
      <div className="flex items-center justify-center gap-[1.2%]">
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-indigo-50 border border-indigo-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-indigo-700">agent</div>
        <div className="w-[10%] flex flex-col items-center">
          <div className="w-full h-[2px] bg-slate-400" />
          <p className="mt-[0.4vh] text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold text-slate-500 uppercase">owns</p>
        </div>
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-emerald-50 border border-emerald-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-emerald-700">role</div>
        <div className="w-[10%] flex flex-col items-center">
          <div className="w-full h-[2px] bg-slate-400" />
          <p className="mt-[0.4vh] text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold text-slate-500 uppercase">claims</p>
        </div>
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-amber-50 border border-amber-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-amber-700">task</div>
        <div className="w-[10%] flex flex-col items-center">
          <div className="w-full h-[2px] bg-slate-400" />
          <p className="mt-[0.4vh] text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold text-slate-500 uppercase">depends_on</p>
        </div>
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-rose-50 border border-rose-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-rose-700">claim</div>
      </div>

      <div className="flex items-center justify-center gap-[1.2%]">
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-sky-50 border border-sky-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-sky-700">receipt</div>
        <div className="w-[16%] flex flex-col items-center">
          <div className="w-full h-[2px] bg-slate-400" />
          <p className="mt-[0.4vh] text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold text-slate-500 uppercase">proves</p>
        </div>
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-violet-50 border border-violet-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-violet-700">dependency</div>
        <div className="w-[16%] flex flex-col items-center">
          <div className="w-full h-[2px] bg-slate-400" />
          <p className="mt-[0.4vh] text-[clamp(0.75rem,0.95vw,1.05rem)] font-bold text-slate-500 uppercase">expires</p>
        </div>
        <div className="px-[0.9vw] py-[0.6vw] rounded-[0.6vw] bg-orange-50 border border-orange-200 text-[clamp(0.9rem,1.15vw,1.3rem)] font-bold text-orange-700">lease</div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide51SwarmOntology;
