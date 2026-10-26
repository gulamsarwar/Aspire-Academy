'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterHeadlineProps {
  headline?: string;
  className?: string;
}

export function TypewriterHeadline({
  headline = 'Learn Today. Lead Tomorrow.',
  className = '',
}: TypewriterHeadlineProps) {
  // Phrases to cycle through in typewriter effect
  const phrases = [
    'Lead Tomorrow.',
    'Score 95%+ in Bihar Board.',
    'Crack NEET with Shekhar Sir.',
    'Master NCERT Line-by-Line.',
    'Lead Tomorrow.',
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(phrases[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fullPhrase = phrases[currentPhraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing phase
      if (displayedText.length < fullPhrase.length) {
        timer = setTimeout(() => {
          setDisplayedText(fullPhrase.slice(0, displayedText.length + 1));
        }, 75);
      } else {
        // Finished typing full phrase, pause before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Deleting phase
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(fullPhrase.slice(0, displayedText.length - 1));
        }, 35);
      } else {
        // Finished deleting, move to next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIndex, mounted, phrases]);

  return (
    <h1
      className={`text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.14] select-none min-h-[96px] sm:min-h-[128px] lg:min-h-[148px] ${className}`}
      aria-label="Learn Today. Lead Tomorrow."
    >
      <span className="block text-slate-900 drop-shadow-sm">Learn Today.</span>
      <span className="inline-flex items-center flex-wrap bg-gradient-to-r from-[#046BD2] via-sky-500 to-indigo-600 bg-clip-text text-transparent">
        <span>{displayedText}</span>
        <span
          className="inline-block w-1 sm:w-1.5 h-7 sm:h-11 lg:h-13 bg-gradient-to-b from-[#046BD2] to-sky-400 ml-1.5 animate-pulse rounded-full shadow-sm shadow-blue-500/50"
          aria-hidden="true"
        />
      </span>
    </h1>
  );
}
