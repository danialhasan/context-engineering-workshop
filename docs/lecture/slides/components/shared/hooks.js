import { useState, useEffect, useRef, useCallback } from 'react';
import { CONFIG } from './theme';

export const usePresentation = (totalSlides) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(console.error);
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
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
      const key = e.key === ' ' ? ' ' : e.key;
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
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, handleMouseMove]);

  return {
    currentIndex,
    setCurrentIndex,
    controlsVisible,
    isFullscreen,
    containerRef,
    nextSlide,
    prevSlide,
    toggleFullscreen,
    handleMouseMove
  };
};
