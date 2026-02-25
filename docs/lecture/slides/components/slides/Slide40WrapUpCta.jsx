import React from 'react';
import { BaseSlide } from '../shared';
import squadWaitlistQr from '../../assets/session/squad-waitlist-qr.png';
import newsletterQr from '../../assets/session/newsletter-qr.png';

const CtaCard = ({ label, title, body, qrSrc, qrAlt, accent = 'indigo', footer }) => (
  <div className={`rounded-[1.1vw] border shadow-sm p-[2.8%] min-h-0 flex flex-col ${
    accent === 'orange'
      ? 'border-orange-200 bg-orange-50/45'
      : 'border-indigo-200 bg-indigo-50/35'
  }`}>
    <div className="flex items-center justify-between mb-[1.4%]">
      <span className={`inline-flex items-center px-[0.9vw] py-[0.38vw] rounded-full border text-[clamp(0.82rem,0.95vw,1rem)] font-bold uppercase tracking-[0.14em] ${
        accent === 'orange'
          ? 'border-orange-200 bg-white/80 text-orange-700'
          : 'border-indigo-200 bg-white/80 text-indigo-700'
      }`}>
        {label}
      </span>
      <span className="text-[clamp(0.85rem,0.95vw,1rem)] font-semibold uppercase tracking-[0.14em] text-slate-500">Scan</span>
    </div>

    <div className="grid grid-cols-[auto,1fr] gap-[1.2vw] items-center flex-1 min-h-0">
      <div className="rounded-[0.9vw] border border-white/70 bg-white p-[0.55vw] shadow-sm">
        <img
          src={qrSrc}
          alt={qrAlt}
          className="w-[clamp(13rem,18vw,20rem)] h-[clamp(13rem,18vw,20rem)] object-contain rounded-[0.6vw]"
        />
      </div>
      <div className="min-w-0">
        <p className={`text-[clamp(1rem,1.18vw,1.25rem)] font-bold uppercase tracking-[0.14em] mb-[0.45vw] ${
          accent === 'orange' ? 'text-orange-700' : 'text-indigo-700'
        }`}>
          {title}
        </p>
        <p className="text-[clamp(1.08rem,1.3vw,1.45rem)] font-semibold text-slate-900 leading-snug mb-[0.55vw]">
          {body}
        </p>
        {footer && <p className="text-[clamp(0.92rem,1.02vw,1.08rem)] text-slate-600 font-medium leading-snug break-words">{footer}</p>}
      </div>
    </div>
  </div>
);

const Slide40WrapUpCta = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[84%]">
    <div className="text-center mb-[2.4%]">
      <div className="inline-flex items-center px-[1vw] py-[0.4vw] rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[clamp(0.82rem,0.95vw,1rem)] font-bold uppercase tracking-[0.16em] mb-[1.1%]">
        Continue Learning
      </div>
      <h2 className="text-[clamp(2.2rem,3.15vw,4rem)] font-bold tracking-tight text-slate-900 mb-[0.8%]">
        Stay in the loop after the workshop
      </h2>
      <p className="text-[clamp(1.02rem,1.28vw,1.42rem)] text-slate-600 font-medium max-w-[82%] mx-auto">
        If this session was useful, subscribe for more context-engineering insights and join the Squad waitlist.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-[2.2%] flex-1 min-h-0">
      <CtaCard
        label="Newsletter"
        title="Squad Scoop"
        body="Subscribe for updates, practical notes, and future workshop drops."
        footer="https://squad-scoop.beehiiv.com/"
        qrSrc={newsletterQr}
        qrAlt="Squad Scoop newsletter QR code"
      />
      <CtaCard
        label="Waitlist"
        title="Squad Beta"
        body="Join the waitlist for Squad, the platform for managing AI agents in agent-native engineering workflows."
        qrSrc={squadWaitlistQr}
        qrAlt="Squad beta waitlist QR code"
        accent="orange"
      />
    </div>
  </BaseSlide>
);

export default Slide40WrapUpCta;
