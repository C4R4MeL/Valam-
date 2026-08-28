'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function ScrollProgressIndicator() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = window.scrollY / totalScroll;
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial run
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <div className="fixed right-3 top-[20%] bottom-[20%] w-[2px] bg-zinc-200/30 rounded-full z-50 pointer-events-none hidden md:block">
      {/* Active Line Progress */}
      <div 
        className="w-full bg-emerald-600 rounded-full transition-all duration-75"
        style={{ height: `${scrollProgress * 100}%` }}
      />
      {/* Moving Dot indicator */}
      <div 
        className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white -left-[4px] shadow-sm transition-all duration-75"
        style={{ top: `calc(${scrollProgress * 100}% - 5px)` }}
      />
    </div>
  );
}
