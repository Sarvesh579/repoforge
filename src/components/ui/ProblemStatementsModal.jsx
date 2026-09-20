import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLenis } from '../../context/LenisContext.jsx';
import { getParticipantTracks } from '../../lib/api';
import styles from './ProblemStatementsModal.module.css';

export default function ProblemStatementsModal({ isOpen, onClose }) {
  const lenis = useLenis();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Fetch only official published problem statements from backend
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);

    getParticipantTracks()
      .then((res) => {
        if (cancelled) return;
        if (res?.data && Array.isArray(res.data)) {
          const mapped = res.data.map((track) => ({
            id: track.id || track.track_id,
            title: track.title || track.name,
            domain: track.domain || track.category || track.theme || 'General',
            shortDescription: track.short_description || track.shortDescription || track.description,
            description: track.description || track.short_description,
            missionBrief: track.missionBrief || track.description,
            whatToBuild: track.whatToBuild || '',
            howToApproach: track.howToApproach || '',
            difficulty: track.difficulty || 'Intermediate',
            tags: track.tags
              ? (Array.isArray(track.tags) ? track.tags : String(track.tags).split(',').map((t) => t.trim()))
              : [],
            reward: track.reward || '',
          }));

          // Sort naturally by PS number (PS001, PS002, PS003, etc.)
          mapped.sort((a, b) => {
            const idA = String(a.id || '');
            const idB = String(b.id || '');
            return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
          });

          setProblems(mapped);
        } else {
          setProblems([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch participant tracks:', err);
        if (!cancelled) setProblems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Strict Scroll Isolation: Freeze landing page & pause Lenis when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    lenis?.stop();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = prevWidth;
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, lenis]);

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getDifficultyClass = (diff = '') => {
    const d = String(diff).toUpperCase();
    if (d.includes('HARD')) return styles.diffHard;
    if (d.includes('ADV')) return styles.diffAdv;
    if (d.includes('BEGIN')) return styles.diffBegin;
    return styles.diffInter;
  };

  return (
    <AnimatePresence>
      <div
        className={styles.backdrop}
        onClick={onClose}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="problem-statements-title"
        >
          {/* ── Modal Header: Clean header with title, subtitle, and close button ── */}
          <div className={styles.modalHeader}>
            <div className={styles.headerTop}>
              <div className={styles.headerTitles}>
                <h2 id="problem-statements-title" className={styles.title}>
                  Explore <span className={styles.titleHighlight}>Problem Statements</span>
                </h2>
                <p className={styles.subtitle}>
                  All official challenge tracks are now live. Browse the problem statements below, select your domain, and register your team to build a high-impact solution.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close Problem Statements Modal"
                title="Close (Esc)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Scrollable Body with isolated scrolling ── */}
          <div
            className={styles.modalBody}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className={styles.emptyState}>
                <div className={styles.spinner}></div>
                <p>Loading problem statements...</p>
              </div>
            ) : problems.length === 0 ? (
              <div className={styles.emptyState}>
                <svg className={styles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <p>No published problem statements available yet.</p>
              </div>
            ) : (
              <div className={styles.problemsGrid}>
                {problems.map((prob) => {
                  const isExpanded = expandedId === prob.id;

                  return (
                    <article key={prob.id} className={styles.problemCard}>
                      {/* Top Meta Bar: PS ID on Left, Difficulty Badge on Right */}
                      <div className={styles.cardHeader}>
                        <span className={styles.idBadge}>{prob.id}</span>
                        {prob.difficulty && (
                          <span className={`${styles.difficultyBadge} ${getDifficultyClass(prob.difficulty)}`}>
                            {prob.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Domain / Category Tag Row */}
                      {prob.domain && (
                        <div className={styles.domainTag} title={prob.domain}>
                          <span className={styles.domainDot}></span>
                          <span className={styles.domainText}>{prob.domain}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className={styles.cardTitle}>{prob.title}</h3>

                      {/* Description with balanced clamp */}
                      <p className={`${styles.cardDesc} ${isExpanded ? styles.cardDescExpanded : ''}`}>
                        {prob.shortDescription || prob.description}
                      </p>

                      {/* Expandable detailed brief */}
                      {isExpanded && (
                        <div className={styles.detailsSection}>
                          {prob.missionBrief && (
                            <div className={styles.detailBlock}>
                              <span className={styles.detailLabel}>
                                <span>🎯</span> Mission Brief
                              </span>
                              <p className={styles.detailText}>{prob.missionBrief}</p>
                            </div>
                          )}

                          {prob.whatToBuild && (
                            <div className={styles.detailBlock}>
                              <span className={styles.detailLabel}>
                                <span>🧭</span> What to Build
                              </span>
                              <p className={styles.detailText}>{prob.whatToBuild}</p>
                            </div>
                          )}

                          {prob.howToApproach && (
                            <div className={styles.detailBlock}>
                              <span className={styles.detailLabel}>
                                <span>⚡</span> How to Approach
                              </span>
                              <p className={styles.detailText}>{prob.howToApproach}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {Array.isArray(prob.tags) && prob.tags.length > 0 && (
                        <div className={styles.tagsRow}>
                          {prob.tags.map((tag, idx) => (
                            <span key={idx} className={styles.tagPill}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className={styles.cardFooter}>
                        <button
                          type="button"
                          className={styles.expandBtn}
                          onClick={() => toggleExpand(prob.id)}
                          aria-expanded={isExpanded}
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                          <svg
                            className={`${styles.expandIcon} ${isExpanded ? styles.expandIconRotated : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>

                        <Link to="/register" className={styles.registerLink} onClick={onClose}>
                          <span>Register Now</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={styles.arrowIcon}>
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Modal Footer ── */}
          <div className={styles.modalFooter}>
            <div className={styles.footerInfo}>
              Showing <strong>{problems.length}</strong> official problem statement{problems.length === 1 ? '' : 's'}
            </div>

            <div className={styles.footerActions}>
              <button type="button" className={styles.footerCloseBtn} onClick={onClose}>
                Close
              </button>
              <Link to="/register" className={styles.footerRegisterBtn} onClick={onClose}>
                <span>Register Your Team</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className={styles.arrowIcon}>
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
