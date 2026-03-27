import { motion, AnimatePresence } from "framer-motion";
import styles from "@/styles/GovtJobsAlerts.module.css";

export default function JobDetailsModal({ job, categories, onClose }) {
  if (!job) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{job.title}</h2>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Organization Information</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Organization:</span>
                <span className={styles.infoValue}>{job.organization}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Government Type:</span>
                <span className={styles.infoValue}>{job.governmentType}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Category:</span>
                <span className={styles.infoValue}>{categories.find(c => c.id === job.category)?.name}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Vacancy Details</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Vacancies:</span>
                <span className={styles.infoValue}>{job.vacancies}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Post Names:</span>
                <span className={styles.infoValue}>{job.postNames}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Eligibility Criteria</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Educational Qualification:</span>
                <span className={styles.infoValue}>{job.qualification}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Age Limit:</span>
                <span className={styles.infoValue}>{job.ageLimit}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Additional Requirements:</span>
                <span className={styles.infoValue}>{job.eligibility}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Important Dates</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Start Date:</span>
                <span className={styles.infoValue}>{new Date(job.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Date:</span>
                <span className={styles.infoValue}>{new Date(job.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Reservation Details</h3>
            <div className={styles.quotaBreakdown}>
              <div className={styles.quotaBreakdownItem}>
                <span className={styles.quotaLabel}>GEN</span>
                <span className={`${styles.quotaValue} ${styles.gen}`}>{job.quota.gen}</span>
              </div>
              <div className={styles.quotaBreakdownItem}>
                <span className={styles.quotaLabel}>SC</span>
                <span className={`${styles.quotaValue} ${styles.sc}`}>{job.quota.sc}</span>
              </div>
              <div className={styles.quotaBreakdownItem}>
                <span className={styles.quotaLabel}>ST</span>
                <span className={`${styles.quotaValue} ${styles.st}`}>{job.quota.st}</span>
              </div>
              <div className={styles.quotaBreakdownItem}>
                <span className={styles.quotaLabel}>OBC</span>
                <span className={`${styles.quotaValue} ${styles.obc}`}>{job.quota.obc}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Examination Details</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Syllabus:</span>
                <span className={styles.infoValue}>{job.syllabus}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Application Fee:</span>
                <span className={styles.infoValue}>{job.applicationFee}</span>
              </div>
            </div>
          </div>

          <div className={styles.modalSection}>
            <h3 className={styles.modalSectionTitle}>Official Information</h3>
            <div className={styles.modalInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Official Website:</span>
                <a href={job.officialWebsite} target="_blank" rel="noopener noreferrer" className={styles.modalWebsiteLink}>
                  {job.officialWebsite}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <path d="M15 3h6v6"/>
                    <path d="M10 14L21 3"/>
                  </svg>
                </a>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Description:</span>
                <span className={styles.infoValue}>{job.description}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalApplyButton}>Apply Now</button>
          <button className={styles.modalDownloadButton}>Download Notification</button>
        </div>
      </motion.div>
    </div>
  );
}
