import React from 'react';
import { BaseSlide } from '../shared';
import squadWaitlistQr from '../../assets/session/squad-waitlist-qr.png';
import danialSocialsQr from '../../assets/session/danial-socials-qr.png';

const InfoChip = ({ children }) => (
  <div className="inline-flex items-center px-[0.9vw] py-[0.45vw] rounded-full bg-white/80 border border-slate-200 text-[clamp(0.92rem,1.02vw,1.1rem)] font-semibold text-slate-700">
    {children}
  </div>
);

const QrCard = ({ label, title, subtitle, qrSrc, qrAlt, accent = 'indigo', footer }) => {
  const theme =
    accent === 'orange'
      ? {
          chip: 'bg-orange-100 text-orange-800 border-orange-200',
          card: 'border-orange-200 bg-orange-50/40',
          title: 'text-orange-700'
        }
      : {
          chip: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          card: 'border-indigo-200 bg-indigo-50/35',
          title: 'text-indigo-700'
        };

  return (
    <div className={`rounded-[1vw] border ${theme.card} shadow-sm p-[2.2%] flex flex-col min-h-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-[0.8vw] mb-[1.1%]">
        <span className={`inline-flex items-center px-[0.9vw] py-[0.38vw] rounded-full border text-[clamp(0.78rem,0.95vw,0.98rem)] font-bold uppercase tracking-[0.14em] ${theme.chip}`}>
          {label}
        </span>
        <span className="text-[clamp(0.85rem,0.95vw,0.98rem)] font-semibold uppercase tracking-[0.14em] text-slate-500">Scan</span>
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-[0.9vw] items-center flex-1 min-h-0">
        <div className="rounded-[0.85vw] border border-white/80 bg-white p-[0.42vw] shadow-sm shrink-0">
          <img
            src={qrSrc}
            alt={qrAlt}
            className="w-[clamp(8.6rem,10.8vw,10.6rem)] h-[clamp(8.6rem,10.8vw,10.6rem)] object-contain rounded-[0.55vw]"
          />
        </div>
        <div className="min-w-0">
          <p className={`text-[clamp(1rem,1.12vw,1.2rem)] font-bold uppercase tracking-[0.12em] ${theme.title} mb-[0.35vw]`}>
            {title}
          </p>
          <p className="text-[clamp(0.95rem,1.04vw,1.08rem)] font-semibold text-slate-900 leading-snug mb-[0.35vw]">
            {subtitle}
          </p>
          {footer ? (
            <p className="text-[clamp(0.84rem,0.9vw,0.94rem)] font-medium text-slate-600 leading-snug break-words">{footer}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Slide01SpeakerIntro = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[81%]">
    <div className="flex items-start justify-between gap-[2vw] mb-[2.2%]">
      <div>
        <div className="inline-flex items-center px-[1vw] py-[0.4vw] rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[clamp(0.85rem,0.95vw,1rem)] font-bold uppercase tracking-[0.16em] mb-[1%]">
          Session Host
        </div>
        <h2 className="text-[clamp(2.4rem,3.45vw,4.2rem)] font-bold leading-tight tracking-tight text-slate-900">
          Hi, I&apos;m Danial
        </h2>
        <p className="text-[clamp(1.05rem,1.32vw,1.48rem)] text-slate-600 font-medium mt-[0.45%]">
          CTO of Squad and Applied AI Consultant
        </p>
      </div>
      <div className="hidden xl:flex items-center gap-[0.6vw] px-[1vw] py-[0.52vw] rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[clamp(0.78rem,0.9vw,0.95rem)] font-bold uppercase tracking-[0.14em]">
        Live Session + Q&A
      </div>
    </div>

    <div className="flex flex-wrap gap-[0.6vw] mb-[1.2%]">
      <InfoChip>danialh.com</InfoChip>
      <InfoChip>linkedin.com/in/dhasandev</InfoChip>
      <InfoChip>Request the deck on X or LinkedIn</InfoChip>
    </div>

    <div className="grid grid-cols-2 gap-[2%] flex-1 min-h-0">
      <QrCard
        accent="indigo"
        label="Danial"
        title="Socials / Contact"
        subtitle="Connect on X or LinkedIn and request the deck."
        qrSrc={danialSocialsQr}
        qrAlt="Danial Hasan socials QR code"
        footer="danialh.com • linkedin.com/in/dhasandev"
      />
      <QrCard
        accent="orange"
        label="Squad"
        title="Beta Waitlist"
        subtitle="Join Squad as we build the platform for managing AI agents."
        qrSrc={squadWaitlistQr}
        qrAlt="Squad waitlist QR code"
        footer="Agent-native engineering beta"
      />
    </div>
  </BaseSlide>
);

export default Slide01SpeakerIntro;
