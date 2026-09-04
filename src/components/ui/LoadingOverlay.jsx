import styles from './LoadingOverlay.module.css';

export default function LoadingOverlay({ visible, label = 'Please wait...' }) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
