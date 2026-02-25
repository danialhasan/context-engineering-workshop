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

const Slide52TypedHandoffs = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Typed Handoffs
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Every handoff must be schema-constrained.
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1 w-full">
      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.6rem)] font-bold text-rose-700 uppercase tracking-wider mb-[2%]">Bad: free-text handoff</p>
        <div className="h-[82%] rounded-[0.7vw] bg-white border border-slate-200 p-[3%]">
          <p className="text-[clamp(1rem,1.3vw,1.5rem)] text-slate-700 font-medium leading-snug">
            "I think it&apos;s mostly done. Maybe check the logs and continue where I left off. Not sure about owner or deadline."
          </p>
        </div>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1rem,1.35vw,1.6rem)] font-bold text-emerald-700 uppercase tracking-wider mb-[2%]">Good: typed handoff</p>
        <pre className="h-[82%] rounded-[0.7vw] bg-slate-900 text-emerald-200 border border-slate-700 p-[3%] overflow-auto text-[clamp(0.85rem,1.05vw,1.2rem)] leading-relaxed">
{`{
  "task_id": "task_42",
  "status": "needs_verification",
  "evidence": ["s3://.../receipt.json"],
  "next_owner": "verifier_agent",
  "deadline": "2026-02-25T16:30:00Z"
}`}
        </pre>
      </div>
    </div>
  </BaseSlide>
);

export default Slide52TypedHandoffs;
