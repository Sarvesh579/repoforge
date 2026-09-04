import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Staggered slide-up variants for the 4 split panels
const panelVariants = {
  open: (index) => ({
    y: '-100%',
    transition: {
      duration: 0.95,
      ease: [0.42, 0, 0.58, 1],
      delay: index * 0.1,
    },
  }),
  closed: (index) => ({
    y: '0%',
    transition: {
      duration: 0.95,
      ease: [0.42, 0, 0.58, 1],
      delay: index * 0.1,
    },
  }),
};

export default function LoaderCurtain({
  stage,
  title = 'REPOFORGE',
  panelColor = '#000000',
  textColor = '#FAB600',
}) {
  const [progress, setProgress] = useState(0);

  // 0% -> 100% counter timer (1.8 seconds)
  useEffect(() => {
    const duration = 1800;
    const interval = 20;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      if (p === 100) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  if (stage === 'done') return null;

  const isOpen = stage === 'darkOpen' || stage === 'lightOpen';

  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* 4 Staggered vertical panels */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            custom={index}
            variants={panelVariants}
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${index * 25}vw`,
              width: '25vw',
              backgroundColor: panelColor,
            }}
          />
        ))}
      </div>

      {/* Content Layer (Title + Progress) */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={isOpen ? { y: '-100%' } : { y: '0%' }}
        transition={{ duration: 0.95, ease: [0.42, 0, 0.58, 1], delay: 0.1 }}
      >
        {/* Main Title Banner */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            paddingBottom: '8vh',
          }}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              color: textColor,
              fontSize: 'clamp(3rem, 10vw, 10rem)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              lineHeight: 0.85,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
          >
            {title}
          </motion.div>
        </div>

        {/* Progress percentage & progress bar line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{
            position: 'absolute',
            bottom: '10vh',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60vw',
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5vh',
          }}
        >
          <div
            style={{
              color: textColor,
              fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              textAlign: 'center',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {Math.round(progress)}%
          </div>

          <div
            style={{
              height: 2,
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: 'rgba(250, 182, 0, 0.2)',
              borderRadius: 1,
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                backgroundColor: textColor,
                borderRadius: 1,
              }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
