"use client";

import { useState } from "react";
import styles from "@/styles/CareerGuide.module.css";

export default function FAQAccordion({ faqs }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleOpen = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faqSection}>
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className={styles.faqItem}>
            <button
              className={styles.faqQuestion}
              onClick={() => toggleOpen(index)}
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <span className={styles.faqIcon}>▼</span>
            </button>
            {isOpen && (
              <div className={styles.faqAnswer}>
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
