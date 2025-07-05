// src/app/components/AccuracyCounter.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface AccuracyCounterProps {
  /** Target percent (0–100) */
  target?: number;
  /** Total duration of the count animation in ms */
  duration?: number;
  /** When false, hold at 0% until start flips true */
  start?: boolean;
}

const AccuracyCounter: React.FC<AccuracyCounterProps> = ({
  target = 98,
  duration = 2000,
  start = true,
}) => {
  const [percent, setPercent] = useState(0);
  const [done, setDone] = useState(false);

  // only kick off when `start` becomes true
  useEffect(() => {
    if (!start) return;
    const stepTime = Math.max(5, duration / target);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setPercent(current);
      if (current >= target) {
        clearInterval(timer);
        setDone(true);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration, start]);

  // little burst particles
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        dx: Math.random() * 120 - 60,
        dy: Math.random() * 120 - 60,
      })),
    []
  );

  return (
    <div className="relative w-full text-center">
      {/* big counter */}
      <div className="text-5xl font-mono text-gray-900 mb-2">
        {percent}%
      </div>

      {/* tube-style bar with blue→purple */}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* little AI “recharging” prompt while counting */}
      {!done && percent < target && (
        <div className="text-sm italic text-gray-500 mb-2">
          Recharging AI…
        </div>
      )}

      {/* burst + final “ACCURACY” */}
      {done && (
        <>
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-600"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 1 }}
                transition={{
                  delay: 0.1 + Math.random() * 0.2,
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              />
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 400, damping: 25 }}
            className="text-lg font-bold text-purple-600"
          >
            ACCURACY
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AccuracyCounter;
