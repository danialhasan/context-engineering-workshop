import React from 'react';
import { BaseSlide } from '../shared';
import danialSocialsQr from '../../assets/session/danial-socials-qr.png';
import danialHeadshot from '../../assets/session/danial-headshot.jpeg';

const Slide36DeckRequest = () => (
  <BaseSlide containerClassName="items-center justify-center" panelClassName="w-[95%] h-[82%]">
    <div className="text-center mb-[1.6%]">
      <div className="inline-flex items-center px-[0.95vw] py-[0.35vw] rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[clamp(0.78rem,0.9vw,0.95rem)] font-bold uppercase tracking-[0.16em] mb-[0.7%]">
        Deck Access
      </div>
      <h2 className="text-[clamp(1.95rem,2.7vw,3.35rem)] font-bold text-slate-900 tracking-tight mb-[0.45%]">
        Want the slides after the session?
      </h2>
      <p className="text-[clamp(0.95rem,1.12vw,1.2rem)] text-slate-600 font-medium">
        Connect with Danial on <span className="font-semibold text-slate-800">X</span> or <span className="font-semibold text-slate-800">LinkedIn</span> and request the deck.
      </p>
    </div>

    <div className="grid grid-cols-12 gap-[2%] flex-1 min-h-0">
      <div className="col-span-3 rounded-[1.05vw] border border-slate-200 bg-white/85 shadow-sm overflow-hidden min-h-0 relative">
        <img src={danialHeadshot} alt="Danial Hasan" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-transparent" />
        <div className="absolute inset-x-[4.5%] bottom-[4.5%] bg-white/87 backdrop-blur rounded-[0.85vw] border border-white/70 shadow-lg p-[3.4%]">
          <p className="text-[clamp(1rem,1.15vw,1.3rem)] font-bold text-slate-900 mb-[0.5%]">Danial Hasan</p>
          <p className="text-[clamp(0.82rem,0.9vw,0.96rem)] text-slate-700 font-medium leading-snug">
            CTO of Squad • Applied AI Consultant
          </p>
        </div>
      </div>

      <div className="col-span-9 rounded-[1.05vw] border border-indigo-200 bg-indigo-50/35 shadow-sm p-[1.8%] grid grid-cols-[auto,1fr] gap-[1.6%] items-center min-h-0 overflow-hidden">
        <div className="rounded-[0.9vw] border border-white/70 bg-white p-[0.48vw] shadow-sm shrink-0">
          <img
            src={danialSocialsQr}
            alt="Danial Hasan socials QR code"
            className="w-[clamp(15rem,22vw,24rem)] h-[clamp(15rem,22vw,24rem)] object-contain rounded-[0.6vw]"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[clamp(0.9rem,1vw,1.08rem)] font-bold uppercase tracking-[0.16em] text-indigo-700 mb-[0.35%]">
            Quick Follow-up
          </p>
          <p className="text-[clamp(1.18rem,1.45vw,1.55rem)] font-bold text-slate-900 leading-tight mb-[0.75%]">
            Scan to connect, then send a short message asking for the deck.
          </p>
          <div className="space-y-[0.38vw] text-[clamp(0.9rem,0.98vw,1.02rem)] text-slate-700 font-medium leading-snug">
            <p>• Mention the workshop name so Danial can send the latest version.</p>
            <p>• LinkedIn: <span className="font-semibold">linkedin.com/in/dhasandev</span></p>
            <p>• X or site: <span className="font-semibold">danialh.com</span></p>
          </div>
        </div>
      </div>
    </div>
  </BaseSlide>
);

export default Slide36DeckRequest;
