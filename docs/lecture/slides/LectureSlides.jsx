import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize, Minimize, 
  Terminal, Activity, ArrowRight, RefreshCw,
  Eye, Brain, Zap, CheckCircle2, AlertTriangle, 
  HelpCircle, XCircle, ShieldAlert, Code2, Database,
  Cpu, Layers
} from 'lucide-react';
import openaiObservabilityStack from './assets/research/openai/openai-observability-stack.png';
import openaiDevtoolsValidationLoop from './assets/research/openai/openai-devtools-validation-loop.png';
import openaiLimitsOfAgentKnowledge from './assets/research/openai/openai-limits-of-agent-knowledge.png';
import openaiLayeredDomainArchitecture from './assets/research/openai/openai-layered-domain-architecture.png';

// --- CONFIGURATION ---
const CONFIG = {
  idleTimeoutMs: 3000,
  keys: {
    next: ['ArrowRight', 'ArrowDown', ' '],
    prev: ['ArrowLeft', 'ArrowUp'],
    fullscreen: 'f'
  }
};

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('presentation-styles')) return;
  const style = document.createElement('style');
  style.id = 'presentation-styles';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    body {
      margin: 0;
      background-color: #f8fafc;
      color: #0f172a;
      overflow: hidden;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  `;
  document.head.appendChild(style);
};

// --- CUSTOM HOOKS ---

const usePresentation = (totalSlides) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(console.error);
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen(); // Safari
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); // Safari
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONFIG.idleTimeoutMs);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key === ' ' ? ' ' : e.key; // Normalize space
      if (CONFIG.keys.next.includes(key)) {
        e.preventDefault(); 
        nextSlide();
      } else if (CONFIG.keys.prev.includes(key)) {
        e.preventDefault();
        prevSlide();
      } else if (key.toLowerCase() === CONFIG.keys.fullscreen) {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    handleMouseMove();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [currentIndex, handleMouseMove]);

  return {
    currentIndex, setCurrentIndex,
    controlsVisible, isFullscreen,
    containerRef,
    nextSlide, prevSlide, toggleFullscreen, handleMouseMove
  };
};

// --- SHARED COMPONENTS ---

const GlassPanel = ({ children, className = "" }) => (
  <div className={`relative overflow-hidden rounded-[2vw] border border-white/60 shadow-xl shadow-slate-900/5 backdrop-blur-[24px] backdrop-saturate-[1.4] bg-white/50 ${className}`}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9)_0%,transparent_60%)] pointer-events-none" />
    <div className="relative z-10 w-full h-full p-[5%] flex flex-col justify-center">
      {children}
    </div>
  </div>
);

// Abstracted Slide Wrapper
const BaseSlide = ({ children, containerClassName = "flex-col", panelClassName = "w-full h-full" }) => (
  <div className={`relative w-full h-full p-[5%] z-10 flex ${containerClassName}`}>
    <GlassPanel className={panelClassName}>
      {children}
    </GlassPanel>
  </div>
);

const DiagramNode = ({ children, isError = false, className = "" }) => (
  <div className={`flex flex-col items-center justify-center px-[2vw] py-[1.5vw] rounded-[1vw] border-[3px] font-bold text-[clamp(1.2rem,2vw,2.5rem)] leading-tight text-center shadow-sm ${
    isError ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white/80 border-slate-300 text-slate-800'
  } ${className}`}>
    {children}
  </div>
);

const ThickArrow = () => (
  <ArrowRight className="w-[clamp(2rem,4vw,5rem)] h-[clamp(2rem,4vw,5rem)] text-slate-400 stroke-[3px] shrink-0" />
);

// --- SLIDE COMPONENTS ---

const Slide01Cover = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[calc(85%+40px)] h-[80%] items-center text-center">
    <h1 className="text-[clamp(4rem,6vw,8rem)] font-bold leading-[1.1] tracking-tight mb-[3%] text-slate-900">
      Context Engineering for <br/>Agent Swarms
    </h1>
    <p className="text-[clamp(1.8rem,3vw,4rem)] text-slate-500 font-semibold tracking-wide uppercase">
      applied research in multi agent systems
    </p>
  </BaseSlide>
);

const Slide02WhatIsAgent = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[80%] text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-indigo-600 uppercase tracking-widest">What Is An Agent?</h2>
    <p className="text-[clamp(2.5rem,4vw,5.5rem)] leading-tight font-semibold text-slate-800 max-w-[90%] mx-auto">
      An agent is a <span className="text-emerald-600">stateful control loop</span> around a <span className="text-rose-600">stateless reasoning model</span>.
    </p>
  </BaseSlide>
);

const Slide03StatefulStateless = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[6%] text-slate-900">Stateless Model, Stateful Agent</h2>
    <div className="flex flex-col gap-[6%] flex-1 justify-center">
      <div className="flex items-center gap-[4%] bg-white/60 p-[4%] rounded-[1.5vw] border border-slate-200 shadow-sm">
        <Brain className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-rose-500 shrink-0" />
        <p className="text-[clamp(2.5rem,4vw,5rem)] font-bold text-slate-900">
          <span className="text-slate-500">Model:</span> inference
        </p>
      </div>
      <div className="flex items-center gap-[4%] bg-indigo-50/80 p-[4%] rounded-[1.5vw] border border-indigo-200 shadow-sm">
        <RefreshCw className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-emerald-600 shrink-0" />
        <p className="text-[clamp(2.5rem,4vw,5rem)] font-bold text-slate-900">
          <span className="text-slate-500">Agent:</span> loop + memory + tools + control
        </p>
      </div>
    </div>
  </BaseSlide>
);

const Slide04AgentLoop = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-slate-900">The Agent Loop</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full max-w-[100%] gap-[1.5vw]">
        <DiagramNode className="flex-1 bg-blue-50 border-blue-300 text-blue-800">Observe</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-purple-50 border-purple-300 text-purple-800">Reason</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-amber-50 border-amber-300 text-amber-800">Act</DiagramNode>
        <ThickArrow />
        <DiagramNode className="flex-1 bg-emerald-50 border-emerald-300 text-emerald-800">Verify</DiagramNode>
        <div className="flex flex-col items-center ml-[1vw]">
          <RefreshCw className="w-[clamp(2.5rem,4vw,5rem)] h-[clamp(2.5rem,4vw,5rem)] text-slate-400 animate-[spin_4s_linear_infinite]" />
          <span className="mt-[0.5vw] text-[clamp(1rem,1.5vw,2rem)] font-bold text-slate-500 uppercase tracking-widest">Repeat</span>
        </div>
      </div>
    </div>
  </BaseSlide>
);

const Slide05WhatIsHarness = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-indigo-600 uppercase tracking-widest">What Is A Harness?</h2>
    <div className="flex flex-col gap-[8%] flex-1 justify-center">
      <p className="text-[clamp(2.5rem,4vw,5rem)] font-semibold text-slate-800 leading-tight">
        The harness <span className="text-indigo-600">surrounds</span> the model.
      </p>
      <div className="w-full h-[4px] bg-slate-200 rounded-full" />
      <p className="text-[clamp(2.5rem,4vw,5rem)] font-semibold text-slate-600 leading-tight">
        It provides tools, memory, context management, and safety.
      </p>
    </div>
  </BaseSlide>
);

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

const Slide07WhyThisMatters = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[80%] text-center border-emerald-300 bg-emerald-50/50">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[8%] text-emerald-600 uppercase tracking-widest">Why This Matters</h2>
    <p className="text-[clamp(3rem,4.5vw,6rem)] leading-[1.2] font-bold text-slate-900 max-w-[90%] mx-auto">
      Most agent failures are not model failures.
      <br/><br/>
      They are <span className="text-emerald-600">context failures.</span>
    </p>
  </BaseSlide>
);

const Slide08FailureUnclearState = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[10%] text-rose-600">Failure Mode: Unclear State</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full gap-[2vw]">
        <DiagramNode>Task</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true}>Missing/Conflicting<br/>State</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true}>Wrong Action</DiagramNode>
      </div>
    </div>
  </BaseSlide>
);

const Slide09FailureAmbiguousTools = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[10%] text-rose-600">Failure Mode: Ambiguous Tools</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full gap-[2vw]">
        <DiagramNode>Task</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true} className="relative">
          <HelpCircle className="absolute -top-[2vw] -right-[2vw] w-[4vw] h-[4vw] text-amber-500 bg-white rounded-full shadow-md" />
          Tool A?<br/><span className="text-rose-400">Tool B?</span>
        </DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true}>Inconsistent<br/>Output</DiagramNode>
      </div>
    </div>
  </BaseSlide>
);

const Slide10FailureNoVerification = () => (
  <BaseSlide panelClassName="w-full h-full text-center">
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[10%] text-rose-600">Failure Mode: No Verification Loop</h2>
    <div className="flex flex-1 items-center justify-center w-full">
      <div className="flex items-center justify-center w-full gap-[2vw]">
        <DiagramNode>Claim 'Done'</DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true} className="relative">
          <XCircle className="absolute -top-[2vw] -right-[2vw] w-[4vw] h-[4vw] text-red-500 bg-white rounded-full shadow-md" />
          No Evidence
        </DiagramNode>
        <ThickArrow />
        <DiagramNode isError={true} className="bg-red-600 border-red-700 text-white shadow-[0_0_2vw_rgba(220,38,38,0.3)]">
          Bad State<br/>Promoted
        </DiagramNode>
      </div>
    </div>
  </BaseSlide>
);

const Slide11FailureAttentionCollapse = () => (
  <BaseSlide>
    <h2 className="text-[clamp(3rem,4vw,5rem)] font-bold mb-[6%] text-rose-600">Failure Mode: Attention Collapse</h2>
    <div className="flex flex-col justify-center flex-1 w-full max-w-[80%] mx-auto gap-[8%]">
      <div className="flex items-center gap-[4%]">
        <Database className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-slate-400 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-slate-800">Too much context</p>
      </div>
      <div className="flex items-center gap-[4%]">
        <Activity className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-amber-500 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-slate-800">Low signal-to-noise</p>
      </div>
      <div className="flex items-center gap-[4%]">
        <ShieldAlert className="w-[clamp(4rem,6vw,8rem)] h-[clamp(4rem,6vw,8rem)] text-rose-500 shrink-0" />
        <p className="text-[clamp(3rem,4vw,5rem)] font-bold text-rose-600">Quality drops</p>
      </div>
    </div>
  </BaseSlide>
);

const Slide12FundamentalProblem = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] justify-center text-center">
    <h2 className="text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold mb-[6%] text-indigo-600 uppercase tracking-widest">
      Fundamental Problem
    </h2>
    <p className="text-[clamp(2.2rem,3vw,4rem)] font-bold text-slate-900 leading-tight mb-[6%] max-w-[95%] mx-auto">
      How do we maintain <span className="text-emerald-600">high-signal</span>, <span className="text-emerald-600">trustworthy</span>, <span className="text-emerald-600">actionable context</span> in long-running agent loops under finite attention and changing state?
    </p>
    <div className="w-[10%] h-[4px] bg-slate-300 rounded-full mx-auto mb-[6%]" />
    <p className="text-[clamp(1.5rem,2vw,2.5rem)] font-medium text-slate-600 max-w-[85%] mx-auto leading-relaxed">
      Same root problem for everyone. Different constraints produce different solutions.
    </p>
  </BaseSlide>
);

const Slide13Primitives = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[90%] h-[90%] justify-center text-center border-indigo-200 bg-indigo-50/50">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[6%] text-slate-500 uppercase tracking-widest">Primitives</h2>
    <p className="text-[clamp(2.5rem,3.5vw,5rem)] font-semibold text-slate-900 leading-[1.3] mb-[6%]">
      Primitives of context engineering systems
    </p>
    <div className="flex flex-wrap justify-center gap-[2vw] text-[clamp(2.5rem,3.5vw,5rem)] font-bold text-indigo-700">
      {['ontology', 'memory', 'tools', 'verification'].map(word => (
        <span key={word} className="bg-indigo-100/80 px-[2vw] py-[1vw] rounded-[1vw] border border-indigo-200 shadow-sm">
          {word}
        </span>
      ))}
    </div>
  </BaseSlide>
);

const Slide14ContextEngineeringSolution = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] justify-center text-center">
    <h2 className="text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold mb-[5%] text-indigo-600 uppercase tracking-widest">
      Solution
    </h2>
    <p className="text-[clamp(2.2rem,3vw,4rem)] font-bold text-slate-900 leading-tight mb-[2.5%] max-w-[95%] mx-auto">
      Context engineering is <span className="text-emerald-600">systems engineering for attention</span>.
    </p>
    <div className="w-[10%] h-[4px] bg-slate-300 rounded-full mx-auto mb-[2%]" />
    <p className="text-[clamp(1.5rem,2vw,2.5rem)] font-medium text-slate-600 mb-[1.5%]">
      You aren&apos;t just writing prompts. You&apos;re designing:
    </p>
    <div className="max-w-[82%] mx-auto text-left">
      <ul className="list-disc pl-[1.2em] space-y-[0.8vh] marker:text-emerald-600 text-[clamp(1.45rem,2vw,2.4rem)] text-slate-800 font-semibold leading-snug">
        <li>what gets written down</li>
        <li>what gets remembered</li>
        <li>what gets verified</li>
        <li>what tools are available when</li>
        <li>how agents recover and coordinate across time</li>
      </ul>
    </div>
  </BaseSlide>
);

const PrimitiveExplainerSlide = ({
  primitiveLabel,
  definition,
  mentalModelTitle,
  mentalModelBody
}) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Primitive: {primitiveLabel}
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Definition + familiar mental model
    </p>
    <div className="flex flex-1 gap-[3%] min-h-0">
      <div className="flex-1 bg-white/80 border border-slate-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[2%]">
          Definition
        </p>
        <p className="text-[clamp(1.8rem,2.5vw,3.2rem)] font-bold text-slate-900 leading-tight">
          {definition}
        </p>
      </div>
      <div className="flex-1 bg-indigo-50/70 border border-indigo-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-[2%]">
          Familiar mental model
        </p>
        <p className="text-[clamp(1.8rem,2.5vw,3.2rem)] font-bold text-slate-900 leading-tight mb-[2.5%]">
          {mentalModelTitle}
        </p>
        <p className="text-[clamp(1.3rem,1.8vw,2.2rem)] font-medium text-slate-700 leading-snug">
          {mentalModelBody}
        </p>
      </div>
    </div>
  </BaseSlide>
);

const PrimitiveExamplesSlide = ({
  primitiveLabel,
  examples
}) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Primitive: {primitiveLabel}
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Examples
    </p>
    <div className="grid grid-cols-3 gap-[2%] flex-1 min-h-0">
      {examples.map((example, idx) => (
        <div
          key={`${primitiveLabel}-${idx}`}
          className="bg-white/80 border border-slate-200 rounded-[1.2vw] p-[4%] shadow-sm flex flex-col"
        >
          <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[3%]">
            Example {idx + 1}
          </p>
          <p className="text-[clamp(1.45rem,2vw,2.5rem)] font-semibold text-slate-900 leading-snug">
            {example}
          </p>
        </div>
      ))}
    </div>
  </BaseSlide>
);

const Slide15PrimitiveOntology = () => (
  <PrimitiveExplainerSlide
    primitiveLabel="Ontology"
    definition="Shared meaning for entities, relationships, states, events, constraints, and handoffs."
    mentalModelTitle="Like a shared legend on a map."
    mentalModelBody="If people read symbols differently, they get lost. Ontology makes sure everyone means the same thing."
  />
);

const Slide16PrimitiveOntologyExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Ontology"
    examples={[
      "Ontology stays generic: model any domain as entities + relationships.",
      "Only labels change by company; primitive structure stays the same.",
      "That shared structure lets agents transfer reasoning across different situations."
    ]}
  />
);

const Slide17OntologyContextGraphExample = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Ontology Example: Context Graph
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same primitives, different domains
    </p>

    <div className="flex-1 w-full bg-white/70 border border-slate-200 rounded-[1.2vw] p-[3.2%] flex flex-col justify-center gap-[9%]">
      <div className="flex items-center justify-between gap-[1.2%]">
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-indigo-50 border border-indigo-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-indigo-700">Entity: Person</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">owns</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-emerald-700">Entity: Team</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">works_on</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-amber-50 border border-amber-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-amber-700">Entity: Task</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">updates</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-rose-50 border border-rose-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-rose-700">Entity: Artifact</p>
        </div>
        <div className="w-[8%] flex flex-col items-center">
          <p className="text-[clamp(0.72rem,0.9vw,1rem)] font-semibold text-slate-500 uppercase tracking-wider mb-[0.25vw]">verifies</p>
          <ArrowRight className="w-[clamp(1.1rem,1.5vw,1.7rem)] h-[clamp(1.1rem,1.5vw,1.7rem)] text-slate-400" />
        </div>
        <div className="flex-1 px-[0.9vw] py-[0.9vw] rounded-[0.8vw] bg-sky-50 border border-sky-200 text-center">
          <p className="text-[clamp(0.95rem,1.1vw,1.25rem)] font-bold text-sky-700">Entity: Receipt</p>
        </div>
      </div>

      <p className="text-center text-[clamp(1.1rem,1.5vw,1.8rem)] font-semibold text-slate-700">
        In another company, labels change. The entity + relationship grammar does not.
      </p>
    </div>
  </BaseSlide>
);

const Slide18OntologyVariableDefinitions = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[80%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Define The Variables
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Same ontology shape, domain-specific labels
    </p>

    <div className="grid grid-cols-2 gap-[2.5%] h-[50vh] overflow-y-auto pr-[0.6%] pb-[10%]">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">Person</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The actor who initiates or owns work.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.5%]">Team</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The coordination boundary for shared goals.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.5%]">Task</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">A unit of work with objective and completion criteria.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.5%]">Artifact</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">The output produced by task execution.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm col-span-2">
        <p className="text-[clamp(1.1rem,1.4vw,1.7rem)] font-bold text-sky-600 uppercase tracking-wider mb-[1.5%]">Receipt</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] font-medium text-slate-700">Verification evidence that determines whether an artifact can be trusted and promoted.</p>
      </div>
    </div>
  </BaseSlide>
);

const Slide16PrimitiveMemory = () => (
  <PrimitiveExplainerSlide
    primitiveLabel="Memory"
    definition="Durable, queryable state across turns and across agents."
    mentalModelTitle="Like a shared notebook for a group project."
    mentalModelBody="Instead of relying on memory, everyone can look up what happened, what was decided, and why."
  />
);

const Slide18PrimitiveMemoryExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Memory"
    examples={[
      "Store prior decisions with source links and timestamps.",
      "Attach failure traces so retries avoid the same path.",
      "Persist team context across parallel subagents."
    ]}
  />
);

const Slide17PrimitiveTools = () => (
  <PrimitiveExplainerSlide
    primitiveLabel="Tools"
    definition="Controlled capability surface with clear contracts and phase rights."
    mentalModelTitle="Like a labeled toolbox with checkout rules."
    mentalModelBody="People do better when each tool has a clear purpose and the right people use it at the right time."
  />
);

const Slide20PrimitiveToolsExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Tools"
    examples={[
      "`search_nodes` + `neighbors`: discovery tools for reading relevant context without mutating state.",
      "`create_task` / `list_tasks` for coordination, then `claim_task` / `complete_task` for execution.",
      "`verify_task` + `write_receipt` gate promotion, then `upsert_node` / `link_edge` can update shared memory."
    ]}
  />
);

const Slide18PrimitiveVerification = () => (
  <PrimitiveExplainerSlide
    primitiveLabel="Verification"
    definition="Evidence gates that decide what gets promoted into shared state."
    mentalModelTitle="Like checking receipts before reimbursement."
    mentalModelBody="Anyone can claim a result. Verification asks for proof before the team treats it as true."
  />
);

const Slide22PrimitiveVerificationExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Verification"
    examples={[
      "Schema checks for every tool output before state updates.",
      "Behavior checks: output must satisfy task acceptance criteria.",
      "Cross-agent claim verification requires receipts before promotion."
    ]}
  />
);

const Slide19ContextAssemblyPattern = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2rem,2.8vw,3.5rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Context Assembly (Runtime Pattern)
    </h2>
    <p className="text-[clamp(1.2rem,1.7vw,2rem)] font-medium text-slate-600 text-center mb-[2.5%]">
      Definition + familiar mental model
    </p>
    <div className="flex flex-1 gap-[3%] min-h-0 w-full">
      <div className="flex-1 bg-white/80 border border-slate-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col overflow-y-auto">
        <p className="text-[clamp(1rem,1.35vw,1.65rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[2%]">
          Definition
        </p>
        <p className="text-[clamp(1.7rem,2.2vw,2.9rem)] font-bold text-slate-900 leading-tight">
          Agent behavior that selects and distills next-step context at runtime.
        </p>
      </div>
      <div className="flex-1 bg-indigo-50/70 border border-indigo-200 rounded-[1.2vw] p-[3%] shadow-sm flex flex-col overflow-y-auto">
        <p className="text-[clamp(1rem,1.35vw,1.65rem)] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-[2%]">
          Familiar mental model
        </p>
        <p className="text-[clamp(1.7rem,2.2vw,2.9rem)] font-bold text-slate-900 leading-tight mb-[2%]">
          Like researchers briefing a decision maker before a meeting.
        </p>
        <p className="text-[clamp(1.2rem,1.6vw,2rem)] font-medium text-slate-700 leading-snug">
          The context system provides access and guardrails. The agent or subagents assemble what matters for the next action.
        </p>
      </div>
    </div>
  </BaseSlide>
);

const Slide24ContextAssemblyExamples = () => (
  <PrimitiveExamplesSlide
    primitiveLabel="Context Assembly (Runtime Pattern)"
    examples={[
      "Read-only discovery subagents fan out, gather evidence fast, and return distilled briefs to a main agent.",
      "A single agent runs retrieval + synthesis before acting when the task is small and latency matters.",
      "Specialized subagents (code, docs, ops) synthesize in parallel; coordinator merges results with receipts."
    ]}
  />
);

const Slide24IndustryResearchTransition = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[3%] text-indigo-600 uppercase tracking-widest">
      Industry Research on Context Engineering
    </h2>
    <p className="text-[clamp(1.6rem,2.2vw,2.7rem)] font-semibold text-slate-800 mb-[4%] max-w-[92%] mx-auto">
      Now we compare how Anthropic, OpenAI, and Manus solved this under different real-world constraints.
    </p>
    <div className="grid grid-cols-3 gap-[2%] w-full">
      <div className="bg-indigo-50 border border-indigo-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-700 mb-[1.5%]">Anthropic</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Long-horizon context reliability</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-700 mb-[1.5%]">OpenAI</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Harness legibility and feedback loops</p>
      </div>
      <div className="bg-rose-50 border border-rose-200 rounded-[1vw] p-[4%]">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-700 mb-[1.5%]">Manus</p>
        <p className="text-[clamp(1rem,1.3vw,1.6rem)] text-slate-700 font-medium">Context hygiene for tool-heavy agents</p>
      </div>
    </div>
  </BaseSlide>
);

const ResearchLabSlide = ({ title, subtitle, bullets, accent = "indigo" }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className={`text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] uppercase tracking-widest text-center ${
      accent === "emerald" ? "text-emerald-600" : accent === "rose" ? "text-rose-600" : "text-indigo-600"
    }`}>
      {title}
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      {subtitle}
    </p>
    <div className="grid grid-cols-1 gap-[2%] flex-1 w-full min-h-0">
      {bullets.map((item, idx) => (
        <div key={`${title}-${idx}`} className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.5%] shadow-sm flex items-center">
          <p className="text-[clamp(1.4rem,2vw,2.5rem)] font-semibold text-slate-800 leading-snug">{item}</p>
        </div>
      ))}
    </div>
  </BaseSlide>
);

const Slide25ResearchSectionOpener = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%] text-center">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[4%] text-indigo-600 uppercase tracking-widest">
      Same Fundamental Problem, Different Constraints
    </h2>
    <div className="flex items-center justify-center gap-[3%] flex-1 w-full">
      <div className="px-[2vw] py-[1.2vw] bg-slate-900 text-white rounded-[1vw] text-[clamp(1.1rem,1.5vw,1.7rem)] font-bold">
        Finite attention + changing state
      </div>
      <ArrowRight className="w-[clamp(1.8rem,2.8vw,3.6rem)] h-[clamp(1.8rem,2.8vw,3.6rem)] text-slate-400" />
      <div className="grid grid-cols-1 gap-[1vh] text-left">
        <div className="px-[1.4vw] py-[0.9vw] bg-indigo-50 border border-indigo-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-indigo-700">Anthropic approach</div>
        <div className="px-[1.4vw] py-[0.9vw] bg-emerald-50 border border-emerald-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-emerald-700">OpenAI approach</div>
        <div className="px-[1.4vw] py-[0.9vw] bg-rose-50 border border-rose-200 rounded-[0.8vw] text-[clamp(1rem,1.3vw,1.5rem)] font-bold text-rose-700">Manus approach</div>
      </div>
    </div>
  </BaseSlide>
);

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
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">1. Derivative problem</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">How their production reality specialized the fundamental problem.</p>
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

const ResearchDiagramSlide = ({ title, subtitle, imageSrc, imageAlt }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.1rem,3vw,3.8rem)] font-bold mb-[2%] text-emerald-600 uppercase tracking-widest text-center">
      {title}
    </h2>
    <p className="text-[clamp(1.2rem,1.7vw,2rem)] font-medium text-slate-600 text-center mb-[2.5%]">
      {subtitle}
    </p>
    <div className="w-full flex-1 min-h-0 bg-slate-900 rounded-[1vw] border border-slate-700 p-[1.2%] flex items-center justify-center">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="max-w-full max-h-full object-contain rounded-[0.6vw]"
      />
    </div>
  </BaseSlide>
);

const ResearchDiagramPairSlide = ({ title, subtitle, leftSrc, leftAlt, rightSrc, rightAlt }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.1rem,3vw,3.8rem)] font-bold mb-[2%] text-emerald-600 uppercase tracking-widest text-center">
      {title}
    </h2>
    <p className="text-[clamp(1.2rem,1.7vw,2rem)] font-medium text-slate-600 text-center mb-[2.5%]">
      {subtitle}
    </p>
    <div className="grid grid-cols-2 gap-[2%] w-full flex-1 min-h-0">
      <div className="bg-slate-900 rounded-[1vw] border border-slate-700 p-[1.1%] flex items-center justify-center">
        <img src={leftSrc} alt={leftAlt} className="max-w-full max-h-full object-contain rounded-[0.5vw]" />
      </div>
      <div className="bg-slate-900 rounded-[1vw] border border-slate-700 p-[1.1%] flex items-center justify-center">
        <img src={rightSrc} alt={rightAlt} className="max-w-full max-h-full object-contain rounded-[0.5vw]" />
      </div>
    </div>
  </BaseSlide>
);

const Slide27AnthropicProblem = () => (
  <ResearchLabSlide
    title="Anthropic"
    subtitle="Problem: Long-running agent quality degrades as context drifts"
    accent="indigo"
    bullets={[
      "Each new session starts with no memory of prior work.",
      "Agents often try to do too much at once or declare done too early.",
      "As stale context accumulates, high-signal grounding drops."
    ]}
  />
);

const Slide28AnthropicConstraints = () => (
  <ResearchLabSlide
    title="Anthropic: Constraints"
    subtitle="Anthropic needed high reliability over long horizons"
    accent="indigo"
    bullets={[
      "Long-running loops where total available state exceeds prompt budget.",
      "Need stable performance without assuming perfect one-shot prompts.",
      "Must preserve useful context while continuously shedding noise."
    ]}
  />
);

const Slide29AnthropicSolution = () => (
  <ResearchLabSlide
    title="Anthropic: Solution Pattern"
    subtitle="Iterative curation under strict context budgets"
    accent="indigo"
    bullets={[
      "Treat context as a scarce resource: continuously select the smallest high-signal subset.",
      "Re-evaluate context at each step instead of blindly appending full history.",
      "Use harness-level structure to keep working memory compact and task-relevant."
    ]}
  />
);

const Slide30OpenAIProblem = () => (
  <ResearchLabSlide
    title="OpenAI: Derivative Problem"
    subtitle="Great outputs are not enough without legible process"
    accent="emerald"
    bullets={[
      "Autonomous coding must be reproducible, not just occasionally impressive.",
      "Without harness structure, output is hard to audit, debug, and hand off.",
      "Demo quality often breaks under production workflow pressure."
    ]}
  />
);

const Slide30OpenAIProblemVisual = () => (
  <ResearchDiagramSlide
    title="OpenAI: Problem Visual"
    subtitle="Limits of agent knowledge from missing external context"
    imageSrc={openaiLimitsOfAgentKnowledge}
    imageAlt="OpenAI diagram showing limits of agent knowledge and unseen context"
  />
);

const Slide31OpenAIConstraints = () => (
  <ResearchLabSlide
    title="OpenAI: Constraints"
    subtitle="Software delivery reality: teams, repos, iteration"
    accent="emerald"
    bullets={[
      "Work must integrate with existing engineering systems and source-of-truth repos.",
      "Need clear intermediate state to support feedback loops and collaboration.",
      "Reliability requires harness policies beyond raw model capability."
    ]}
  />
);

const Slide31OpenAIConstraintsVisual = () => (
  <ResearchDiagramSlide
    title="OpenAI: Constraints Visual"
    subtitle="Layered architecture with explicit boundaries"
    imageSrc={openaiLayeredDomainArchitecture}
    imageAlt="OpenAI diagram of layered domain architecture and cross-cutting boundaries"
  />
);

const Slide32OpenAISolution = () => (
  <ResearchLabSlide
    title="OpenAI: Solution Pattern"
    subtitle="Harness engineering as the reliability layer"
    accent="emerald"
    bullets={[
      "Use the harness as an operating system around the model: tools, memory, and control.",
      "Make state and actions legible so humans and agents can iterate safely.",
      "Close loops with verification and feedback, not just one-pass generation."
    ]}
  />
);

const Slide32OpenAISolutionVisuals = () => (
  <ResearchDiagramPairSlide
    title="OpenAI: Solution Visuals"
    subtitle="Observability + tool-driven validation feedback loops"
    leftSrc={openaiObservabilityStack}
    leftAlt="OpenAI diagram showing observability stack and feedback loop with Codex"
    rightSrc={openaiDevtoolsValidationLoop}
    rightAlt="OpenAI sequence diagram for validating work with Chrome DevTools MCP"
  />
);

const Slide33ManusProblem = () => (
  <ResearchLabSlide
    title="Manus: Derivative Problem"
    subtitle="Open-ended tasks in messy real-world environments"
    accent="rose"
    bullets={[
      "Open-ended tasks create ambiguous context needs.",
      "Tool-heavy trajectories compound noise and state drift.",
      "Weak context hygiene leads to brittle continuity between steps."
    ]}
  />
);

const Slide34ManusConstraints = () => (
  <ResearchLabSlide
    title="Manus: Constraints"
    subtitle="Long horizon, tool noise, and memory pressure"
    accent="rose"
    bullets={[
      "Agents must maintain coherence across many actions and external tool results.",
      "Context updates need to be cheap enough to run continuously.",
      "System must preserve useful failures and corrections, not hide them."
    ]}
  />
);

const Slide35ManusSolution = () => (
  <ResearchLabSlide
    title="Manus: Solution Pattern"
    subtitle="Disciplined memory updates and context hygiene"
    accent="rose"
    bullets={[
      "Use explicit recitation/summary updates to stabilize long-horizon memory.",
      "Preserve failure traces as usable context for recovery and adaptation.",
      "Favor structured retrieval and controlled context refresh over unbounded transcript growth."
    ]}
  />
);

const Slide36CrossLabSynthesis = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Cross-Lab Synthesis
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      Different implementations, same invariants
    </p>
    <div className="grid grid-cols-4 gap-[1.2%] flex-1 min-h-0 text-[clamp(0.95rem,1.15vw,1.3rem)]">
      <div className="bg-slate-100 border border-slate-300 rounded-[0.7vw] p-[3%] font-bold text-slate-700">Invariant</div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-[0.7vw] p-[3%] font-bold text-indigo-700">Anthropic</div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-[0.7vw] p-[3%] font-bold text-emerald-700">OpenAI</div>
      <div className="bg-rose-50 border border-rose-200 rounded-[0.7vw] p-[3%] font-bold text-rose-700">Manus</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Ontology</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Task-relevant state framing</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Legible process and roles</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Structured memory semantics</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Memory</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">High-signal curation</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Repo + harness state</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Recitation + updates</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Tools</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Controlled context injection</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Harness-mediated tool loops</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Tool-rich long horizon flows</div>

      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%] font-semibold text-slate-700">Verification</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Keep quality stable over time</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Feedback and legibility loops</div>
      <div className="bg-white/80 border border-slate-200 rounded-[0.7vw] p-[3%]">Failure traces as signal</div>
    </div>
  </BaseSlide>
);

const Slide37WorkshopBridge = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.2rem,3.2vw,4.2rem)] font-bold mb-[2.5%] text-indigo-600 uppercase tracking-widest text-center">
      Workshop Bridge: What We Implement
    </h2>
    <p className="text-[clamp(1.3rem,1.9vw,2.1rem)] font-medium text-slate-600 text-center mb-[3%]">
      AWS is infrastructure for context engineering, not the lesson itself
    </p>
    <div className="grid grid-cols-2 gap-[2.5%] flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-indigo-600 uppercase tracking-wider mb-[1.5%]">State and memory</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Graph nodes and edges in DynamoDB to persist durable agent context.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-emerald-600 uppercase tracking-wider mb-[1.5%]">Artifacts and receipts</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Verification evidence and logs stored as artifacts, linked into graph state.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-rose-600 uppercase tracking-wider mb-[1.5%]">Tool layer</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Allowlisted, role-aware skills exposed to agents for retrieval, coordination, and verification.</p>
      </div>
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[3%] shadow-sm">
        <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-amber-600 uppercase tracking-wider mb-[1.5%]">Runtime assembly</p>
        <p className="text-[clamp(1.25rem,1.7vw,2rem)] text-slate-700 font-medium">Agents and subagents assemble context at runtime using the system&apos;s primitives.</p>
      </div>
    </div>
  </BaseSlide>
);

// --- MAIN PRESENTATION COMPONENT ---

const Presentation = ({ slides }) => {
  const {
    currentIndex, setCurrentIndex,
    controlsVisible, isFullscreen,
    containerRef,
    nextSlide, prevSlide, toggleFullscreen, handleMouseMove
  } = usePresentation(slides.length);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#f8fafc] overflow-hidden font-['Plus_Jakarta_Sans'] text-slate-900"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove} 
    >
      {/* GLOBAL BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-100 to-slate-200" />

      {/* Slides Container */}
      {slides.map((SlideComponent, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out flex flex-col ${
            index === currentIndex
              ? 'opacity-100 scale-100 z-10'
              : index < currentIndex
              ? 'opacity-0 scale-[0.98] -z-10 pointer-events-none'
              : 'opacity-0 scale-[1.02] -z-10 pointer-events-none'
          }`}
          aria-hidden={index !== currentIndex}
        >
          {Math.abs(index - currentIndex) <= 1 && <SlideComponent />}
        </div>
      ))}

      {/* Presentation UI Layer */}
      <div
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!controlsVisible}
      >
        {/* Top Right Keyboard Hint */}
        <div className="absolute top-[3%] right-[3%] text-[clamp(0.7rem,1vw,1rem)] text-slate-500 tracking-[0.2em] font-medium uppercase pointer-events-auto bg-white/60 backdrop-blur-md px-[1vw] py-[0.5vw] rounded-full border border-white/60 shadow-sm">
          [ ← / → / Space ] Nav &nbsp; [ F ] Fullscreen
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-[3%] left-[3%] right-[3%] flex items-center justify-between pointer-events-auto bg-white/60 backdrop-blur-md px-[2%] py-[1.5%] rounded-[1vw] border border-white/60 shadow-lg">
          
          {/* Left: Counter */}
          <div className="w-[15%] text-[clamp(0.9rem,1.2vw,1.25rem)] font-bold text-slate-800" aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')} 
            <span className="text-slate-500 ml-2">/ {String(slides.length).padStart(2, '0')}</span>
          </div>

          {/* Center: Dynamic Progress Dots */}
          <div className="flex-1 flex justify-center gap-[1%] px-[5%]" role="tablist">
            {slides.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-[4px] rounded-full transition-all duration-500 cursor-pointer hover:bg-slate-500 ${
                  idx === currentIndex ? 'w-[4%] bg-slate-800' : 'w-[1.5%] bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Right: Controls */}
          <div className="w-[15%] flex items-center justify-end gap-[15%]">
            <button 
              onClick={prevSlide} 
              aria-label="Previous Slide"
              className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-[clamp(1.5rem,2vw,2rem)] h-[clamp(1.5rem,2vw,2rem)]" />
            </button>
            <button 
              onClick={nextSlide} 
              aria-label="Next Slide"
              className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
              disabled={currentIndex === slides.length - 1}
            >
              <ChevronRight className="w-[clamp(1.5rem,2vw,2rem)] h-[clamp(1.5rem,2vw,2rem)]" />
            </button>
            <div className="w-[1px] h-[clamp(1.5rem,2vw,2rem)] bg-slate-300" aria-hidden="true" />
            <button 
              onClick={toggleFullscreen} 
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-[clamp(1.2rem,1.5vw,1.5rem)] h-[clamp(1.2rem,1.5vw,1.5rem)]" />
              ) : (
                <Maximize className="w-[clamp(1.2rem,1.5vw,1.5rem)] h-[clamp(1.2rem,1.5vw,1.5rem)]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP ENTRY ---

export default function App() {
  useEffect(() => {
    injectStyles();
  }, []);

  const lectureSlides = [
    Slide01Cover,
    Slide02WhatIsAgent,
    Slide03StatefulStateless,
    Slide04AgentLoop,
    Slide05WhatIsHarness,
    Slide06ModelVsHarness,
    Slide07WhyThisMatters,
    Slide08FailureUnclearState,
    Slide09FailureAmbiguousTools,
    Slide10FailureNoVerification,
    Slide11FailureAttentionCollapse,
    Slide12FundamentalProblem,
    Slide14ContextEngineeringSolution,
    Slide13Primitives,
    Slide15PrimitiveOntology,
    Slide16PrimitiveOntologyExamples,
    Slide17OntologyContextGraphExample,
    Slide18OntologyVariableDefinitions,
    Slide16PrimitiveMemory,
    Slide18PrimitiveMemoryExamples,
    Slide17PrimitiveTools,
    Slide20PrimitiveToolsExamples,
    Slide18PrimitiveVerification,
    Slide22PrimitiveVerificationExamples,
    Slide19ContextAssemblyPattern,
    Slide24ContextAssemblyExamples,
    Slide24IndustryResearchTransition,
    Slide25ResearchSectionOpener,
    Slide26ResearchMethodFrame,
    Slide27AnthropicProblem,
    Slide28AnthropicConstraints,
    Slide29AnthropicSolution,
    Slide30OpenAIProblem,
    Slide30OpenAIProblemVisual,
    Slide31OpenAIConstraints,
    Slide31OpenAIConstraintsVisual,
    Slide32OpenAISolution,
    Slide32OpenAISolutionVisuals,
    Slide33ManusProblem,
    Slide34ManusConstraints,
    Slide35ManusSolution,
    Slide36CrossLabSynthesis,
    Slide37WorkshopBridge
  ];

  return <Presentation slides={lectureSlides} />;
}
