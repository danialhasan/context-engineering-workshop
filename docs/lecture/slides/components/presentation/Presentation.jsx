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

    if (
      firstSwarmIndex !== -1 &&
      index >= firstSwarmIndex &&
      (firstWorkshopIndex === -1 || index < firstWorkshopIndex)
    ) {
      return 'Swarm Mechanics';
    }

    if (slideName.includes('Swarm')) return 'Swarm Mechanics';
    if (slideName.includes('Workshop')) return 'Workshop';
    if (index === 0) return 'Cover';
    if (index === 1) return 'Table Of Contents';
    if (index >= 2 && index <= 13) return 'Fundamentals';
    if (index >= 14 && index <= 26) return 'Context Engineering Mechanics';
    if (firstSwarmIndex !== -1 && index >= 27 && index < firstSwarmIndex) return 'Industry Research';
    if (index >= 27 && firstSwarmIndex === -1) return 'Industry Research';
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
        <div className="absolute top-[3%] left-[3%] text-[clamp(0.7rem,1vw,1rem)] text-slate-600 tracking-[0.18em] font-bold uppercase pointer-events-auto bg-white/60 backdrop-blur-md px-[1vw] py-[0.5vw] rounded-full border border-white/60 shadow-sm">
          {currentSectionLabel}
        </div>

        <div className="absolute top-[3%] right-[3%] text-[clamp(0.7rem,1vw,1rem)] text-slate-500 tracking-[0.2em] font-medium uppercase pointer-events-auto bg-white/60 backdrop-blur-md px-[1vw] py-[0.5vw] rounded-full border border-white/60 shadow-sm">
          [ ← / → / Space ] Nav &nbsp; [ F ] Fullscreen
        </div>

        <div className="absolute bottom-[3%] left-[3%] right-[3%] flex items-center justify-between pointer-events-auto bg-white/60 backdrop-blur-md px-[2%] py-[1.5%] rounded-[1vw] border border-white/60 shadow-lg">
          <div className="w-[15%] text-[clamp(0.9rem,1.2vw,1.25rem)] font-bold text-slate-800" aria-live="polite">
            {String(currentIndex + 1).padStart(2, '0')}
            <span className="text-slate-500 ml-2">/ {String(slides.length).padStart(2, '0')}</span>
          </div>

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
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
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

export default Presentation;
