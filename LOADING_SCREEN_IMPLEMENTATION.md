# Loading Screen Animation Implementation Guide

A complete, self-contained guide to porting the split-curtain loading screen animation with an interactive progress counter and staggered panel exit into another React / Next.js / Vite project.

---

## 1. Overview & Visual Behavior

The loading screen consists of two main visual layers and three sequential phases:

1. **4 Vertical Split Panels (Curtain)**:
   - Covers the entire viewport initially (`fixed inset-0 z-50`).
   - Slices the viewport into 4 columns (`25vw` width each).
   - On opening, panels slide up (`y: '-100%'`) with a staggered delay (`index * 0.1s`), creating a wave/stepped curtain reveal effect.

2. **Center Title & Progress Counter**:
   - Centered large hero title (e.g. `PORTFOLIO`) that slides up smoothly into view upon load.
   - Live percentage counter at the bottom (`0%` to `100%`).
   - Synchronized minimalist progress bar line with subtle opacity background.
   - Sliders and text animate upwards together as the curtain lifts.

3. **Lifecycle Timing Sequence**:
   - `0ms`: Curtain visible. Progress counter begins counting `0% -> 100%` over 1.8s.
   - `1800ms`: Progress hits 100%. A deliberate pause occurs (holding at 100% for ~1 second for visual satisfaction).
   - `2800ms`: Curtain opens (`y: -100%` with staggered columns). Underlying app content is revealed.
   - `4050ms`: Curtain animation finishes completely, component is unmounted from the DOM.

---

## 2. Dependencies & Prerequisites

Install `framer-motion` in your destination project:

```bash
npm install framer-motion
# or
pnpm add framer-motion
# or
yarn add framer-motion
```

Tailwind CSS (v3 or v4) is recommended for utility classes (`fixed`, `inset-0`, `flex`, `overflow-hidden`, etc.). If your project does not use Tailwind, equivalent vanilla CSS styles are provided in section 5.

---

## 3. Component Code (`LoaderCurtain.tsx`)

Create a component named `LoaderCurtain.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export interface LoaderCurtainProps {
  stage: 'darkStart' | 'darkOpen' | 'lightCover' | 'lightOpen' | 'done'
  title?: string
  panelColor?: string
  textColor?: string
}

// Staggered slide-up variants for the 4 split panels
const panelVariants = {
  open: (index: number) => ({
    y: '-100%',
    transition: {
      duration: 0.95,
      ease: [0.42, 0, 0.58, 1] as const,
      delay: index * 0.1,
    },
  }),
  closed: (index: number) => ({
    y: '0%',
    transition: {
      duration: 0.95,
      ease: [0.42, 0, 0.58, 1] as const,
      delay: index * 0.1,
    },
  }),
}

export const LoaderCurtain = ({
  stage,
  title = 'PORTFOLIO',
  panelColor = '#7A1A2A', // Deep Oxblood / Burgundy
  textColor = '#F2F2F2',
}: LoaderCurtainProps) => {
  const [progress, setProgress] = useState(0)

  // 0% -> 100% Counter timer (1.8 seconds)
  useEffect(() => {
    const duration = 1800
    const interval = 20
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed += interval
      const p = Math.min((elapsed / duration) * 100, 100)
      setProgress(p)
      if (p === 100) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  if (stage === 'done') return null

  const isOpen = stage === 'darkOpen' || stage === 'lightOpen'

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* 4 Staggered vertical panels */}
      <div className="absolute inset-0 flex">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            custom={index}
            variants={panelVariants}
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            className="absolute top-0 bottom-0"
            style={{
              left: `${index * 25}vw`,
              width: '25vw',
              backgroundColor: panelColor,
            }}
          />
        ))}
      </div>

      {/* Content Layer (Title + Progress) */}
      <motion.div
        className="absolute inset-0"
        animate={isOpen ? { y: '-100%' } : { y: '0%' }}
        transition={{ duration: 0.95, ease: [0.42, 0, 0.58, 1], delay: 0.1 }}
      >
        {/* Main Title Banner */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pb-[8vh]">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="leading-[0.85] tracking-tight uppercase select-none font-bold"
            style={{
              color: textColor,
              fontSize: 'clamp(4rem, 11vw, 12rem)',
              fontFamily: 'var(--font-display, inherit)',
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
          className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 w-[60vw] max-w-[600px] flex flex-col gap-[1.5vh]"
        >
          <div
            className="text-center leading-none select-none"
            style={{
              color: textColor,
              fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
              fontFamily: 'var(--font-display, inherit)',
            }}
          >
            {Math.round(progress)}%
          </div>

          <div
            className="h-[2px] w-full overflow-hidden relative"
            style={{ backgroundColor: 'rgba(242, 242, 242, 0.2)' }}
          >
            <motion.div
              className="absolute top-0 bottom-0 left-0"
              style={{ backgroundColor: textColor }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.2 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
```

---

## 4. Integration into Parent App / Layout

In your main page or layout component (e.g. `App.tsx`, `page.tsx`, or `_app.tsx`):

```tsx
import { useState, useEffect } from 'react'
import { LoaderCurtain } from './components/LoaderCurtain'

type LoaderStage = 'darkStart' | 'darkOpen' | 'lightCover' | 'lightOpen' | 'done'

export default function App() {
  const [loaderStage, setLoaderStage] = useState<LoaderStage>('darkStart')
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    // 1. Wait for progress bar (1.8s) + a 1s pause before opening curtain
    const openTimer = window.setTimeout(() => {
      setLoaderStage('darkOpen')
    }, 2800)

    // 2. Unmount from DOM after curtain slide animation completes (2800ms + 1250ms)
    const doneTimer = window.setTimeout(() => {
      setLoaderStage('done')
      setShowLoader(false)
    }, 4050)

    return () => {
      clearTimeout(openTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  return (
    <main className="relative min-h-screen">
      {/* Loader */}
      {showLoader && <LoaderCurtain stage={loaderStage} title="YOUR BRAND" />}

      {/* Actual Website Content */}
      <section className="p-10">
        <h1 className="text-4xl font-bold">Welcome to my site</h1>
        <p>This content was hidden behind the split curtain animation.</p>
      </section>
    </main>
  )
}
```

---

## 5. Customization Options

### 1. Panel Colors & Background
- **Default color**: `#7A1A2A` (Wine / Oxblood).
- Change by passing `panelColor="#111111"` for dark stealth aesthetic, or `#0f172a` for slate navy.

### 2. Changing the Number of Columns
Currently divided into 4 columns of `25vw` each (`[0, 1, 2, 3]`).
- For **3 columns**: Use `[0, 1, 2]` with `left: ${index * 33.333}vw` and `width: 33.334vw`.
- For **5 columns**: Use `[0, 1, 2, 3, 4]` with `left: ${index * 20}vw` and `width: 20vw`.

### 3. Font Setup
The loader references `var(--font-display)`. For the exact typography from this project:
- In Google Fonts or your CSS, use a bold condensed display font like **Anton**, **Bebas Neue**, or **Syne**:
  ```css
  :root {
    --font-display: 'Anton', sans-serif;
  }
  ```

### 4. Custom Speed & Duration
- **Faster reveal**: Reduce the counter duration from `1800ms` to `1000ms`, `openTimer` to `1500ms`, and `doneTimer` to `2500ms`.
- **Easting curve**: Panels use cubic-bezier `ease: [0.42, 0, 0.58, 1]` for smooth mechanical deceleration.

---

## 6. Vanilla CSS Fallback (Without Tailwind)

If your target project does not use Tailwind CSS, add this CSS:

```css
.loader-curtain-root {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
}

.loader-panels-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
}

.loader-title-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding-bottom: 8vh;
}

.loader-progress-container {
  position: absolute;
  bottom: 10vh;
  left: 50%;
  transform: translateX(-50%);
  width: 60vw;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5vh;
}
```
