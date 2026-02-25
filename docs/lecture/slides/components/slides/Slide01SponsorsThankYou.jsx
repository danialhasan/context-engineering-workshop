import React from 'react';
import { BaseSlide } from '../shared';

const SponsorCard = ({ name, accent, tagline, body, cta }) => (
  <div className={`rounded-[1.1vw] border shadow-sm p-[2.4%] min-h-0 flex flex-col overflow-hidden ${
    accent === 'emerald'
      ? 'border-emerald-200 bg-emerald-50/50'
      : 'border-amber-200 bg-amber-50/45'
  }`}>
    <div className="flex items-center justify-between mb-[0.9%]">
      <span className={`inline-flex items-center px-[0.85vw] py-[0.34vw] rounded-full border text-[clamp(0.72rem,0.82vw,0.88rem)] font-bold uppercase tracking-[0.14em] ${
        accent === 'emerald'
          ? 'border-emerald-200 bg-white/80 text-emerald-700'
          : 'border-amber-200 bg-white/80 text-amber-700'
      }`}>
        Sponsor
      </span>
      <span className={`text-[clamp(0.8rem,0.9vw,0.95rem)] font-bold uppercase tracking-[0.14em] ${
        accent === 'emerald' ? 'text-emerald-700' : 'text-amber-700'
      }`}>
        {name}
      </span>
    </div>

    <p className="text-[clamp(1.05rem,1.35vw,1.45rem)] font-bold text-slate-900 leading-tight mb-[0.7%]">{tagline}</p>
    <p className="text-[clamp(0.9rem,1vw,1.04rem)] text-slate-700 font-medium leading-snug mb-[0.8%]">{body}</p>
    <p className="text-[clamp(0.86rem,0.96vw,1rem)] font-semibold text-slate-800 leading-snug">{cta}</p>
  </div>
);

const Slide01SponsorsThankYou = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[82%] text-center">
    <div className="inline-flex items-center mx-auto px-[0.95vw] py-[0.35vw] rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[clamp(0.76rem,0.88vw,0.95rem)] font-bold uppercase tracking-[0.16em] mb-[0.9%]">
      Thank You To Our Sponsors
    </div>
    <h2 className="text-[clamp(1.95rem,2.7vw,3.35rem)] font-bold tracking-tight text-slate-900 mb-[0.8%]">
      Rootly + AWS
    </h2>
    <p className="text-[clamp(0.92rem,1.06vw,1.15rem)] font-medium text-slate-600 mb-[1.8%] max-w-[85%] mx-auto leading-snug">
      This workshop is possible because of great infra support and teams that care about reliable AI systems in production.
    </p>

    <div className="grid grid-cols-2 gap-[2%] flex-1 min-h-0 text-left">
      <SponsorCard
        name="Rootly"
        accent="emerald"
        tagline="AI-native SRE and incident response workflows"
        body="Rootly helps engineering teams run modern reliability operations with automation across incidents, alerts, and coordination."
        cta="Interested in AI SRE? Find the Rootly team here and ask how they&apos;re thinking about AI + reliability."
      />
      <SponsorCard
        name="AWS"
        accent="amber"
        tagline="Cloud infrastructure for the workshop runtime"
        body="AWS provides the infrastructure substrate used in this workshop stack, including the services we use for state, artifacts, and model-adjacent execution."
        cta="Building on AWS during the workshop? Find an AWS Solutions Architect here for help getting unstuck quickly."
      />
    </div>
  </BaseSlide>
);

export default Slide01SponsorsThankYou;
