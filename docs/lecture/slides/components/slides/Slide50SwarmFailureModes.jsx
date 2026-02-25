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

const Slide50SwarmFailureModes = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.3%] text-rose-600 uppercase tracking-widest text-center">
      Swarm Failure Modes
    </h2>
    <div className="grid grid-cols-2 gap-[2.2%] flex-1 w-full">
      {[
        { title: 'Coordination Drift', note: 'Agents diverge from shared objective.' },
        { title: 'Duplicate Work', note: 'Parallel agents solve the same subtask.' },
        { title: 'Contradictory Claims', note: 'Two outputs assert conflicting facts.' },
        { title: 'Stale Shared Memory', note: 'Outdated state drives wrong actions.' }
      ].map((item, idx) => (
        <div key={item.title} className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
          <p className="text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-slate-500 uppercase tracking-wider mb-[2%]">
            {String.fromCharCode(97 + idx)}. {item.title}
          </p>
          <div className="h-[55%] rounded-[0.7vw] border border-slate-300 bg-slate-50 flex items-center justify-center mb-[2%]">
            <p className="text-[clamp(1.05rem,1.35vw,1.55rem)] font-semibold text-slate-700 text-center px-[5%]">
              {item.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  </BaseSlide>
);

export default Slide50SwarmFailureModes;
