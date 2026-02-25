import React, { useEffect } from 'react';
import Presentation from './components/presentation/Presentation';
import lectureSlides from './components/lectureSlides';
import { injectStyles } from './components/shared';

export default function LectureSlidesApp() {
  useEffect(() => {
    injectStyles();
  }, []);

  return <Presentation slides={lectureSlides} />;
}
