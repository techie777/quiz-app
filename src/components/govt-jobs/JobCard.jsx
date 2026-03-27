import { motion } from "framer-motion";
import styles from "@/styles/GovtJobsAlerts.module.css";

export default function JobCard({ job, index, isExpanded, onToggleExpand, onViewDetails }) {
  return (
    <motion.article
      className={`${styles.jobCard} ${isExpanded ? styles.expanded : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className={styles.jobHeader}>
        <div className={styles.jobInfo}>
          <h2 className={styles.jobTitle}>{job.title}</h2>
          <div className={styles.jobMeta}>
            <span className={styles.organization}>{job.organization}</span>
            <span className={styles.governmentType}>{job.governmentType}</span>
          </div>
        </div>
        <div className={styles.jobActionsTop}>
          <button 
            className={styles.expandButton}
            onClick={() => onToggleExpand(job.id)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={isExpanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
            </svg>
          </button>
          <button className={styles.whatsappButton} title="Get alerts on WhatsApp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.216 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
          <button className={styles.saveButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.collapsibleContent}>
        <div className={styles.vacancySection}>
          <div className={styles.vacancyInfo}>
            <span className={styles.vacancyLabel}>Total Vacancies:</span>
            <span className={styles.vacancyCount}>{job.vacancies}</span>
          </div>
          <div className={styles.postNames}>
            <span className={styles.postNamesLabel}>Posts:</span>
            <span className={styles.postNamesText}>{job.postNames}</span>
          </div>
        </div>

        <div className={styles.eligibilitySection}>
          <h3 className={styles.sectionTitle}>Eligibility Criteria</h3>
          <div className={styles.eligibilityGrid}>
            <div className={styles.eligibilityItem}>
              <span className={styles.eligibilityLabel}>Educational Qualification:</span>
              <span className={styles.eligibilityValue}>{job.qualification}</span>
            </div>
            <div className={styles.eligibilityItem}>
              <span className={styles.eligibilityLabel}>Age Limit:</span>
              <span className={styles.eligibilityValue}>{job.ageLimit}</span>
            </div>
            <div className={styles.eligibilityItem}>
              <span className={styles.eligibilityLabel}>Additional Requirements:</span>
              <span className={styles.eligibilityValue}>{job.eligibility}</span>
            </div>
          </div>
        </div>

        <div className={styles.datesSection}>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Start Date:</span>
            <span className={styles.dateValue}>{new Date(job.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>Last Date:</span>
            <span className={styles.dateValue}>{new Date(job.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className={styles.quotaSection}>
          <h3 className={styles.sectionTitle}>Job Quota Distribution</h3>
          <div className={styles.quotaGrid}>
            <div className={styles.quotaItem}>
              <span className={styles.quotaLabel}>GEN:</span>
              <span className={`${styles.quotaValue} ${styles.gen}`}>{job.quota.gen}</span>
            </div>
            <div className={styles.quotaItem}>
              <span className={styles.quotaLabel}>SC:</span>
              <span className={`${styles.quotaValue} ${styles.sc}`}>{job.quota.sc}</span>
            </div>
            <div className={styles.quotaItem}>
              <span className={styles.quotaLabel}>ST:</span>
              <span className={`${styles.quotaValue} ${styles.st}`}>{job.quota.st}</span>
            </div>
            <div className={styles.quotaItem}>
              <span className={styles.quotaLabel}>OBC:</span>
              <span className={`${styles.quotaValue} ${styles.obc}`}>{job.quota.obc}</span>
            </div>
          </div>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.syllabusSection}>
            <h3 className={styles.sectionTitle}>Syllabus</h3>
            <p className={styles.syllabusText}>{job.syllabus}</p>
          </div>
          <div className={styles.feeSection}>
            <h3 className={styles.sectionTitle}>Application Fee</h3>
            <p className={styles.feeText}>{job.applicationFee}</p>
          </div>
        </div>

        <div className={styles.websiteSection}>
          <span className={styles.websiteLabel}>Official Website:</span>
          <a href={job.officialWebsite} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
            {job.officialWebsite}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <path d="M15 3h6v6"/>
              <path d="M10 14L21 3"/>
            </svg>
          </a>
        </div>
      </div>

      <div className={styles.jobActions}>
        <button className={styles.applyButton}>Apply Now</button>
        <button className={styles.detailsButton} onClick={() => onViewDetails(job)}>View Details</button>
        <button className={styles.downloadButton}>Download Notification</button>
      </div>
    </motion.article>
  );
}
