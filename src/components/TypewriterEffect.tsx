// src/app/components/TypewriterEffect.tsx
import React, { useEffect, useRef, useState } from 'react';

export interface TypewriterEffectProps {
  text: string;
  speed?: number;
  /** Called once when typing finishes */
  onComplete?: () => void;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  speed = 50,
  onComplete,
}) => {
  const [displayed, setDisplayed] = useState('');
  const index = useRef(0);

  useEffect(() => {
    setDisplayed('');
    index.current = 0;

    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text.charAt(index.current));
      index.current += 1;

      if (index.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);  // ← removed onComplete from deps

  return <span>{displayed}</span>;
};

export default TypewriterEffect;
