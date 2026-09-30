import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLenis } from '../../context/LenisContext.jsx';
import styles from './ResultsModal.module.css';

const resultImages = [
  'Shortlist-1.png',
  'Shortlist-2.png',
  'Waitlist.png',
];

export default function ResultsModal({ isOpen, onClose }) {
  const lenis = useLenis();
  const [resultIndex, setResultIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const showPrevious = () => {
    setDirection(-1);
    setResultIndex(
      (prev) => (prev - 1 + resultImages.length) % resultImages.length
    );
  };

  const showNext = () => {
    setDirection(1);
    setResultIndex(
      (prev) => (prev + 1) % resultImages.length
    );
  };

  // Keyboard controls + scroll isolation
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    lenis?.stop();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrevious();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, lenis]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className={styles.backdrop}
        onClick={onClose}
        data-lenis-prevent="true"
      >
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{
            duration: 0.28,
            ease: [0.16, 1, 0.3, 1],
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="results-title"
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerTitles}>
              <h2 id="results-title" className={styles.title}>
                <span>RepoForge</span> Results
              </h2>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close Results Modal"
              title="Close (Esc)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Image */}
          <div
            className={styles.imageSection}
            data-lenis-prevent="true"
          >
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={direction}
            >
              <motion.img
                key={resultImages[resultIndex]}
                src={`/${resultImages[resultIndex]}`}
                alt={`Result ${resultIndex + 1}`}
                custom={direction}
                initial={{
                  opacity: 0,
                  x: direction * 60,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: direction * -60,
                  scale: 0.97,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={styles.resultImage}
              />
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button
              type="button"
              className={styles.arrow}
              onClick={showPrevious}
              aria-label="Previous result"
              title="Previous (←)"
            >
              &#8249;
            </button>

            <div className={styles.indicators}>
              {resultImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`${styles.indicator} ${
                    index === resultIndex
                      ? styles.activeIndicator
                      : ''
                  }`}
                  onClick={() => {
                    setDirection(index > resultIndex ? 1 : -1);
                    setResultIndex(index);
                  }}
                  aria-label={`Show result ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className={styles.arrow}
              onClick={showNext}
              aria-label="Next result"
              title="Next (→)"
            >
              &#8250;
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}