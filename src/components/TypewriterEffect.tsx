import React, { useEffect, useState } from 'react';

export interface TypewriterEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  text,
  speed = 50,
  onComplete,
}) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    let isCancelled = false;

    const typeNext = () => {
      if (isCancelled) return;
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
        setTimeout(typeNext, speed);
      } else {
        onComplete?.();
      }
    };

    setDisplayed('');
    typeNext();

    return () => {
      isCancelled = true;
    };
  }, [text, speed]);

  return <span>{displayed}</span>;
};

export default TypewriterEffect;
