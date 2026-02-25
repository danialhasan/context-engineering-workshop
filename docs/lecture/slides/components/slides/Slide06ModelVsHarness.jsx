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

const Slide06ModelVsHarness = () => (
  <BaseSlide panelClassName="w-full h-full !p-[4%]">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[4%] text-center text-slate-900">Model vs Harness</h2>
    <div className="flex w-full flex-1 gap-[4%] min-h-0">
      <div className="flex-1 flex flex-col bg-white/80 border border-slate-200 shadow-sm rounded-[1.5vw] p-[4%] overflow-hidden">
        <div className="flex items-center gap-[3%] mb-[6%]">
          <Cpu className="w-[clamp(3rem,4vw,6rem)] h-[clamp(3rem,4vw,6rem)] text-rose-500 shrink-0" />
          <h3 className="text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold text-slate-900">Model</h3>
        </div>
        <ul className="text-[clamp(1.8rem,2.5vw,3rem)] text-slate-600 space-y-[6%] list-disc pl-[1.2em] marker:text-rose-500 flex-1 overflow-y-auto">
          <li className="leading-tight pl-[0.2em]">reasoning</li>
          <li className="leading-tight pl-[0.2em]">token prediction</li>
        </ul>
      </div>
      <div className="flex-1 flex flex-col bg-indigo-50/80 border border-indigo-200 shadow-sm rounded-[1.5vw] p-[4%] overflow-hidden">
        <div className="flex items-center gap-[3%] mb-[6%]">
          <Layers className="w-[clamp(3rem,4vw,6rem)] h-[clamp(3rem,4vw,6rem)] text-indigo-600 shrink-0" />
          <h3 className="text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold text-slate-900">Harness</h3>
        </div>
        <ul className="text-[clamp(1.8rem,2.5vw,3rem)] text-slate-700 space-y-[6%] list-disc pl-[1.2em] marker:text-indigo-600 flex-1 overflow-y-auto">
          <li className="leading-tight pl-[0.2em]">tool execution</li>
          <li className="leading-tight pl-[0.2em]">state</li>
          <li className="leading-tight pl-[0.2em]">context</li>
          <li className="leading-tight pl-[0.2em]">verification</li>
        </ul>
      </div>
    </div>
  </BaseSlide>
);

export default Slide06ModelVsHarness;
