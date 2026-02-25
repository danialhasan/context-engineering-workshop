import React from 'react';
import { usePresentation, ChevronLeft, ChevronRight, Maximize, Minimize } from '../shared';

const Presentation = ({ slides }) => {
  const {
    currentIndex,
    setCurrentIndex,
    controlsVisible,
    isFullscreen,
    containerRef,
    nextSlide,
    prevSlide,
    toggleFullscreen,
    handleMouseMove
  } = usePresentation(slides.length);

  const getSectionLabel = (index) => {
    const slideName = slides[index]?.name || '';
    const firstWorkshopIndex = slides.findIndex((s) => (s?.name || '').includes('Workshop'));
    const firstSwarmIndex = slides.findIndex((s) => (s?.name || '').includes('Swarm'));

    if (slideName.includes('Cover')) return 'Cover';
    if (slideName.includes('SpeakerIntro') || slideName.includes('Sponsors')) return 'Opening';
    if (slideName.includes('HowLectureBuilds')) return 'Table Of Contents';
    if (slideName.includes('DeckRequest') || slideName.includes('Workshop') || slideName.includes('WrapUp')) return 'Workshop';
    if (
      firstSwarmIndex !== -1 &&
      index >= firstSwarmIndex &&
      (firstWorkshopIndex === -1 || index < firstWorkshopIndex)
    ) {
      return 'Swarm Mechanics';
    }
    if (slideName.includes('Swarm')) return 'Swarm Mechanics';
    if (
      slideName.includes('Research') ||
      slideName.includes('Anthropic') ||
      slideName.includes('OpenAI') ||
      slideName.includes('Manus') ||
      slideName.includes('CrossLab')
    ) {
      return 'Industry Research';
    }
    if (
      slideName.includes('Primitive') ||
      slideName.includes('Ontology') ||
      slideName.includes('ContextEngineering') ||
      slideName.includes('ContextAssembly')
    ) {
      return 'Context Engineering Mechanics';
    }
    if (slideName.includes('Agent') || slideName.includes('Harness') || slideName.includes('Failure') || slideName.includes('FundamentalProblem')) {
      return 'Fundamentals';
    }
    return 'Section';
  };

  const currentSectionLabel = getSectionLabel(currentIndex);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-[#f8fafc] overflow-hidden font-['Plus_Jakarta_Sans'] text-slate-900"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      <div className="absolute inset-0 z-0 bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-100 to-slate-200" />

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

      <div
        className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!controlsVisible}
      >
        <div className="absolute top-[2%] left-[2.2%] text-[clamp(0.62rem,0.9vw,0.9rem)] text-slate-600 tracking-[0.18em] font-bold uppercase pointer-events-auto bg-white/60 backdrop-blur-md px-[0.85vw] py-[0.42vw] rounded-full border border-white/60 shadow-sm">
          {currentSectionLabel}
        </div>

        <div className="absolute top-[2%] right-[2.2%] text-[clamp(0.62rem,0.9vw,0.9rem)] text-slate-500 tracking-[0.18em] font-medium uppercase pointer-events-auto bg-white/60 backdrop-blur-md px-[0.85vw] py-[0.42vw] rounded-full border border-white/60 shadow-sm">
          [ ← / → / Space ] Nav &nbsp; [ F ] Fullscreen
        </div>

        <div className="absolute bottom-[1.2%] left-[2.2%] right-[2.2%] flex items-center justify-between pointer-events-auto bg-white/55 backdrop-blur-md px-[1.35%] py-[0.8%] rounded-[0.9vw] border border-white/60 shadow-lg">
          <div className="w-[14%] text-[clamp(0.82rem,1.05vw,1.1rem)] font-bold text-slate-800" aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')}
            <span className="text-slate-500 ml-2">/ {String(slides.length).padStart(2, '0')}</span>
          </div>

          <div className="flex-1 flex justify-center gap-[0.8%] px-[4%]" role="tablist">
            {slides.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-[3px] rounded-full transition-all duration-500 cursor-pointer hover:bg-slate-500 ${
                  idx === currentIndex ? 'w-[3.6%] bg-slate-800' : 'w-[1.35%] bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="w-[14%] flex items-center justify-end gap-[12%]">
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-[clamp(1.25rem,1.7vw,1.75rem)] h-[clamp(1.25rem,1.7vw,1.75rem)]" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentIndex === slides.length - 1}
            >
              <ChevronRight className="w-[clamp(1.25rem,1.7vw,1.75rem)] h-[clamp(1.25rem,1.7vw,1.75rem)]" />
            </button>
            <div className="w-[1px] h-[clamp(1.2rem,1.55vw,1.55rem)] bg-slate-300" aria-hidden="true" />
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-[clamp(1.05rem,1.25vw,1.3rem)] h-[clamp(1.05rem,1.25vw,1.3rem)]" />
              ) : (
                <Maximize className="w-[clamp(1.05rem,1.25vw,1.3rem)] h-[clamp(1.05rem,1.25vw,1.3rem)]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentation;
