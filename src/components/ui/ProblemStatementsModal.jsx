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
          {/* ── Modal Header: Clean header with only title, subtitle, and close button ── */}
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
                      <div className={styles.cardHeader}>
                        <div className={styles.cardBadges}>
                          <span className={styles.idBadge}>{prob.id}</span>
                          <span className={styles.domainBadge}>{prob.domain}</span>
                        </div>
                        {prob.difficulty && (
                          <span className={`${styles.difficultyBadge} ${getDifficultyClass(prob.difficulty)}`}>
                            {prob.difficulty}
                          </span>
                        )}
                      </div>

                      <h3 className={styles.cardTitle}>{prob.title}</h3>

                      <p className={styles.cardDesc}>
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
                        >
                          {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                        </button>

                        <Link to="/register" className={styles.registerLink} onClick={onClose}>
                          Register Now →
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
              <Link to="/register" className={styles.registerLink} onClick={onClose} style={{ padding: '8px 18px', fontSize: '0.86rem' }}>
                Register Your Team →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
