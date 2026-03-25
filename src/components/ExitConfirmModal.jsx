"use client";

import styles from "@/styles/ExitConfirmModal.module.css";

export default function ExitConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  progress, 
  score, 
  totalQuestions,
  customTitle,
  customMessage,
  confirmText = "Yes, Exit Quiz"
}) {
  if (!isOpen) return null;

  const handleConfirmAction = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{customTitle || "Exit Quiz?"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.warningIcon}>⚠️</div>
          
          <div className={styles.progressInfo}>
            <p className={styles.progressText}>
              You are <strong>{progress}%</strong> through this quiz.
            </p>
            <p className={styles.scoreText}>
              Current Score: <strong>{score}/{totalQuestions}</strong>
            </p>
          </div>
          
          <div className={styles.warningMessage}>
            <p><strong>Warning:</strong> {customMessage || "Your progress will be lost if you exit now."}</p>
            {customMessage ? (
              <p>Are you sure you want to continue?</p>
            ) : (
              <p>Are you sure you want to exit this quiz?</p>
            )}
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            {customTitle ? "Cancel - Stay Here" : "Cancel - Continue Quiz"}
          </button>
          <button className={styles.confirmButton} onClick={handleConfirmAction}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
