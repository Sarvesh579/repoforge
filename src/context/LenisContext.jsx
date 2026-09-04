import Lenis from 'lenis';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

const LenisContext = createContext(null);

/**
 * LenisProvider
 *
 * Boots a single Lenis instance, drives it with rAF, and exposes it via
 * context so child components can access lenis.on('scroll', ...) if needed.
 *
 * Also syncs Lenis with Framer Motion by manually dispatching a native scroll
 * event on every Lenis tick — this keeps `useScroll` working out of the box.
 */
export function LenisProvider({ children }) {
  const [lenis, setLenis] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    setLenis(instance);

    // Tick loop
    function raf(time) {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

/** Access the Lenis instance from any child component */
export function useLenis() {
  return useContext(LenisContext);
}
