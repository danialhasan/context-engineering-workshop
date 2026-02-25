import React from 'react';
import { BaseSlide } from './ui';

export const PrimitiveExplainerSlide = ({ primitiveLabel, definition, mentalModelTitle, mentalModelBody }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%]">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Primitive: {primitiveLabel}
    </h2>
    <p className="text-[clamp(1.15rem,1.65vw,1.9rem)] font-medium text-slate-600 text-center mb-[2.4%]">
      Definition + familiar mental model
    </p>
    <div className="flex flex-1 gap-[3%] min-h-0">
      <div className="flex-1 bg-white/80 border border-slate-200 rounded-[1.2vw] p-[2.6%] shadow-sm flex flex-col min-h-0">
        <p className="text-[clamp(0.95rem,1.25vw,1.4rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[1.6%]">Definition</p>
        <p className="text-[clamp(1.35rem,1.95vw,2.65rem)] font-bold text-slate-900 leading-[1.15]">{definition}</p>
      </div>
      <div className="flex-1 bg-indigo-50/70 border border-indigo-200 rounded-[1.2vw] p-[2.6%] shadow-sm flex flex-col min-h-0">
        <p className="text-[clamp(0.95rem,1.25vw,1.4rem)] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-[1.6%]">
          Familiar mental model
        </p>
        <p className="text-[clamp(1.35rem,1.95vw,2.55rem)] font-bold text-slate-900 leading-[1.12] mb-[1.8%]">{mentalModelTitle}</p>
        <p className="text-[clamp(1rem,1.35vw,1.55rem)] font-medium text-slate-700 leading-[1.28]">{mentalModelBody}</p>
      </div>
    </div>
  </BaseSlide>
);

export const PrimitiveExamplesSlide = ({ primitiveLabel, examples }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%]">
    <h2 className="text-[clamp(2rem,3vw,4rem)] font-bold mb-[2%] text-indigo-600 uppercase tracking-widest text-center">
      Primitive: {primitiveLabel}
    </h2>
    <p className="text-[clamp(1.1rem,1.6vw,1.9rem)] font-medium text-slate-600 text-center mb-[2.4%]">Examples</p>
    <div className="grid grid-cols-3 gap-[2%] flex-1 min-h-0">
      {examples.map((example, idx) => (
        <div key={`${primitiveLabel}-${idx}`} className="bg-white/80 border border-slate-200 rounded-[1.2vw] p-[3.2%] shadow-sm flex flex-col min-h-0">
          <p className="text-[clamp(1.1rem,1.5vw,1.8rem)] font-bold text-slate-500 uppercase tracking-[0.12em] mb-[3%]">
            Example {idx + 1}
          </p>
          <p className="text-[clamp(1.2rem,1.7vw,2.1rem)] font-semibold text-slate-900 leading-snug">{example}</p>
        </div>
      ))}
    </div>
  </BaseSlide>
);

export const ResearchLabSlide = ({ title, subtitle, bullets, accent = 'indigo' }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%]">
    <h2
      className={`text-[clamp(2rem,3vw,4rem)] font-bold mb-[2%] uppercase tracking-widest text-center ${
        accent === 'emerald' ? 'text-emerald-600' : accent === 'rose' ? 'text-rose-600' : 'text-indigo-600'
      }`}
    >
      {title}
    </h2>
    <p className="text-[clamp(1.1rem,1.6vw,1.9rem)] font-medium text-slate-600 text-center mb-[2.4%]">{subtitle}</p>
    <div className="grid grid-cols-1 gap-[2%] flex-1 w-full min-h-0">
      {bullets.map((item, idx) => (
        <div key={`${title}-${idx}`} className="bg-white/80 border border-slate-200 rounded-[1vw] p-[2.1%] shadow-sm flex items-center min-h-0">
          <p className="text-[clamp(1.15rem,1.6vw,2rem)] font-semibold text-slate-800 leading-snug">{item}</p>
        </div>
      ))}
    </div>
  </BaseSlide>
);

export const ResearchOverviewSlide = ({ company, goal, focusLabel, focusText, accent = 'indigo' }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[87%] text-center">
    <h2
      className={`text-[clamp(2.05rem,3vw,4rem)] font-bold mb-[2.2%] uppercase tracking-widest ${
        accent === 'emerald' ? 'text-emerald-600' : accent === 'rose' ? 'text-rose-600' : 'text-indigo-600'
      }`}
    >
      {company}
    </h2>
    <div className="grid grid-cols-2 gap-[2.4%] w-full flex-1">
      <div className="bg-white/80 border border-slate-200 rounded-[1vw] p-[4%] shadow-sm flex flex-col justify-center text-left">
        <p className="text-[clamp(0.92rem,1.2vw,1.35rem)] font-bold text-slate-500 uppercase tracking-wider mb-[1.6%]">Goal</p>
        <p className="text-[clamp(1.28rem,1.8vw,2.35rem)] font-bold text-slate-900 leading-tight">{goal}</p>
      </div>
      <div
        className={`rounded-[1vw] p-[4%] shadow-sm border flex flex-col justify-center text-left ${
          accent === 'emerald'
            ? 'bg-emerald-50 border-emerald-200'
            : accent === 'rose'
            ? 'bg-rose-50 border-rose-200'
            : 'bg-indigo-50 border-indigo-200'
        }`}
      >
        <p
          className={`text-[clamp(0.92rem,1.2vw,1.35rem)] font-bold uppercase tracking-wider mb-[1.6%] ${
            accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-700' : 'text-indigo-700'
          }`}
        >
          {focusLabel}
        </p>
        <p className="text-[clamp(1.28rem,1.8vw,2.35rem)] font-bold text-slate-900 leading-tight">{focusText}</p>
      </div>
    </div>
  </BaseSlide>
);

export const ResearchDiagramSlide = ({ title, subtitle, imageSrc, imageAlt }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.1rem,3vw,3.8rem)] font-bold mb-[2%] text-emerald-600 uppercase tracking-widest text-center">{title}</h2>
    {subtitle && <p className="text-[clamp(1.2rem,1.7vw,2rem)] font-medium text-slate-600 text-center mb-[2.5%]">{subtitle}</p>}
    <div className="w-full flex-1 min-h-0 bg-slate-900 rounded-[1vw] border border-slate-700 p-[1.2%] flex items-center justify-center">
      <img src={imageSrc} alt={imageAlt} className="max-w-full max-h-full object-contain rounded-[0.6vw]" />
    </div>
  </BaseSlide>
);

export const ResearchDiagramPairSlide = ({ title, subtitle, leftSrc, leftAlt, rightSrc, rightAlt }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <h2 className="text-[clamp(2.1rem,3vw,3.8rem)] font-bold mb-[2%] text-emerald-600 uppercase tracking-widest text-center">{title}</h2>
    {subtitle && <p className="text-[clamp(1.2rem,1.7vw,2rem)] font-medium text-slate-600 text-center mb-[2.5%]">{subtitle}</p>}
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

export const ResearchImageOnlySlide = ({ imageSrc, imageAlt }) => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[85%]">
    <div className="w-full h-full bg-slate-900 rounded-[1vw] border border-slate-700 p-[1.2%] flex items-center justify-center">
      <img src={imageSrc} alt={imageAlt} className="max-w-full max-h-full object-contain rounded-[0.6vw]" />
    </div>
  </BaseSlide>
);
