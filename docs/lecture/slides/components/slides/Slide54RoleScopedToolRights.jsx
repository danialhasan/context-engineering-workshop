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

const Slide54RoleScopedToolRights = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.2%] text-indigo-600 uppercase tracking-widest text-center">
      Role-Scoped Tool Rights
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Not all agents should have the same tool access.
    </p>
    <div className="w-full flex-1 grid grid-cols-5 gap-[1.3%] text-[clamp(0.85rem,1.05vw,1.2rem)]">
      {['Role', 'Discovery', 'Execution', 'Verification', 'Graph Write'].map((h) => (
        <div key={h} className="bg-slate-100 border border-slate-300 rounded-[0.6vw] p-[2.2%] font-bold text-slate-700">{h}</div>
      ))}
      {[
        ['planner', '✓', '△', '△', '△'],
        ['researcher', '✓', '✕', '△', '✕'],
        ['executor', '△', '✓', '△', '△'],
        ['verifier', '✓', '✕', '✓', '✓']
      ].map((row) => row.map((cell, idx) => (
        <div
          key={`${row[0]}-${idx}`}
          className={`border rounded-[0.6vw] p-[2.2%] font-semibold ${
            idx === 0
              ? 'bg-white border-slate-300 text-slate-800'
              : cell === '✓'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : cell === '✕'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          {cell}
        </div>
      )))}
    </div>
  </BaseSlide>
);

export default Slide54RoleScopedToolRights;
