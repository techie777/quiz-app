import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import FAQAccordion from "@/components/FAQAccordion";
import LanguageToggle from "@/components/LanguageToggle";

export const metadata = {
  title: "IAS Officer Career Guide | Step-by-Step Roadmap & Salary",
  description: "Complete guide on how to become an IAS Officer. Explore preparation strategies, salaries, attempt limits, exams, roles, and real inspiration stories.",
  keywords: "IAS officer, UPSC preparation, IAS roadmap, civil services, IAS salary, become IAS"
};

const faqs = [
  { question: "IAS banne ke liye minimum qualification kya hai?", answer: "Graduation required hai. Aapne kisi bhi stream (Arts, Commerce, Science) se graduation kiya ho, aap UPSC de sakte hain." },
  { question: "IAS banne me kitna time lagta hai?", answer: "Syllabus cover karne aur exam clear karne me generally 2-5 saal lag sakte hain, average 3-5 years lagte hain." },
  { question: "Kya bina coaching ke IAS ban sakte hain?", answer: "Haan, self-study aur right strategy se bilkul possible hai. Consistency sabse zyada important hoti hai." },
  { question: "IAS ki starting salary kitni hoti hai?", answer: "IAS officer ki basic starting salary ₹56,100 hoti hai, includes allowances also." },
  { question: "Kitni attempts milti hain UPSC exam me?", answer: "General category: 6, OBC: 9, SC/ST: Unlimited (up to age limit)." },
  { question: "Kya English zaroori hai UPSC ke liye?", answer: "Nahi, Hindi ya apni regional language me bhi paper diya ja sakta hai aur interview bhi." },
  { question: "Kya graduation ke baad preparation start kar sakte hain?", answer: "Bilkul, bahut se toppers graduation ke baad ya college ke final year me start karte hain." },
  { question: "Best books kaunsi hain UPSC ke liye?", answer: "Start with NCERTs (6 to 12), phir standard books jaise Polity by M. Laxmikanth, History by Spectrum." },
  { question: "Agar failure mila toh kya backup options hain?", answer: "Aap State PCS, SSC, Banking, ya teaching me apply kar sakte hain kyuki syllabus similar hota hai." },
];

export default function IASCareerGuide() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className={styles.container} suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />
      
      {/* 1 & 2. Basic Info & Short Description */}
      <section className={styles.hero}>
        <LanguageToggle />
        <span className={styles.categoryTag}>Government Job</span>
        <h1 className={styles.heroTitle}>IAS Officer</h1>
        <p className={styles.heroDesc}>
          IAS officer India ki sabse prestigious government job hoti hai. Yeh officers district, state aur central level par administration handle karte hain aur desh ke development me important role play karte hain.
        </p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Difficulty Level</div>
            <div className={styles.statValue}>Very Hard 🔴</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Competition</div>
            <div className={styles.statValue}>Extremely High 📈</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Average Salary</div>
            <div className={styles.statValue}>₹56,100 – ₹2.5L+ 💰</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Work Type</div>
            <div className={styles.statValue}>Field + Office 🏢</div>
          </div>
        </div>
      </section>

      {/* 3 & 4. Why Choose & Who Should Avoid */}
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div className={styles.prosCard}>
            <h2 className={styles.sectionTitle}><span>🎯</span> Why Choose IAS?</h2>
            <ul className={styles.prosConsList}>
              <li><span>✅</span> High respect & power in society</li>
              <li><span>🛡️</span> Exceptional Job security</li>
              <li><span>🌍</span> Direct impact on people&apos;s lives</li>
              <li><span>💼</span> Good salary + perks (house, car, staff)</li>
              <li><span>👑</span> Top-level Leadership roles</li>
            </ul>
          </div>
          <div className={styles.consCard}>
            <h2 className={styles.sectionTitle}><span>🚫</span> Who Should Avoid?</h2>
            <ul className={styles.prosConsList}>
              <li><span>💸</span> Jo sirf paisa kamane ke liye aa rahe hain</li>
              <li><span>⏳</span> Jinke paas patience bilkul nahi hai</li>
              <li><span>📚</span> Jo long-term continuous preparation nahi kar sakte</li>
              <li><span>⚖️</span> Jo stress ya high pressure handle nahi kar sakte</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. What You Will Become */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>👨‍💼</span> What You Will Become</h2>
        <div className={styles.gridCards}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Top Roles</h3>
            <ul className={styles.cardList}>
              <li>District Magistrate (DM)</li>
              <li>Collector</li>
              <li>Policy Maker</li>
              <li>Senior Government Administrator</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Daily Work / Routine</h3>
            <ul className={styles.cardList}>
              <li>Law & order manage karna</li>
              <li>Government schemes ko district me implement karna</li>
              <li>Public issues aur grievances solve karna</li>
              <li>Various departments ki meetings lena</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Inspiration Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>🌟</span> Inspiration Stories</h2>
        <div className={styles.storyGrid}>
          <div className={styles.storyCard}>
            <div className={styles.quoteIcon}>&quot;</div>
            <div className={styles.storyBg}>Middle-class Family</div>
            <h3 className={styles.cardTitle}>The Power of Consistency</h3>
            <p className={styles.storyStruggle}>
              Failed 3 times in Prelims. Worked a part-time job to support preparation. Cleared in the 4th attempt with top rank.
            </p>
            <div className={styles.storyLearning}>
              <div className={styles.learningLabel}>Key Learning:</div>
              <div className={styles.learningText}>Consistency is key. Never give up on your dreams.</div>
            </div>
          </div>
          <div className={styles.storyCard}>
            <div className={styles.quoteIcon}>&quot;</div>
            <div className={styles.storyBg}>Village Background</div>
            <h3 className={styles.cardTitle}>Self-Study Triumph</h3>
            <p className={styles.storyStruggle}>
              Hindi medium student from a small village with zero access to premium coaching. Relied purely on standard books and internet.
            </p>
            <div className={styles.storyLearning}>
              <div className={styles.learningLabel}>Key Learning:</div>
              <div className={styles.learningText}>Right strategy + Self-study &gt; Expensive coaching.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Experts / Role Models */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>🧑‍🏫</span> Role Models to Follow</h2>
        <div className={styles.gridCards}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>Strict Administrator Model</h3>
            <ul className={styles.cardList}>
              <li>Known for fearlessly tackling corruption and enforcing strict law & order.</li>
              <li><strong>Learning:</strong> Discipline, unbiased decision making, and raw courage.</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>The Innovator / Reformer</h3>
            <ul className={styles.cardList}>
              <li>Brought massive education and healthcare reforms in their remote districts.</li>
              <li><strong>Learning:</strong> Innovation in governance and empathy for the public.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Roadmap & 9. Time Required */}
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div>
            <h2 className={styles.sectionTitle}><span>🛤️</span> Complete Roadmap</h2>
            <div className={styles.roadmapStepper}>
              <div className={styles.stepperItem}>
                <div className={styles.stepperIcon}>1</div>
                <div className={styles.stepperContent}>
                  <h3 className={styles.stepperTitle}>After 10th</h3>
                  <p className={styles.careerDesc}>Koi bhi stream le sakte ho (Arts, Science, Commerce). Focus on building basics with NCERTs and read newspapers.</p>
                </div>
              </div>
              <div className={styles.stepperItem}>
                <div className={styles.stepperIcon}>2</div>
                <div className={styles.stepperContent}>
                  <h3 className={styles.stepperTitle}>After 12th & Graduation</h3>
                  <p className={styles.careerDesc}>Graduation continue karo. Core subjects (Polity, History) ke standard books start karo. Optional subject decide karo.</p>
                </div>
              </div>
              <div className={styles.stepperItem}>
                <div className={styles.stepperIcon}>3</div>
                <div className={styles.stepperContent}>
                  <h3 className={styles.stepperTitle}>UPSC Attempt Phase</h3>
                  <p className={styles.careerDesc}>Dedicate 1 full year for Prelims + Mains mock tests. Formulate test taking strategy and answer writing practice.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className={styles.sectionTitle}><span>⏳</span> Time Required</h2>
            <div className={styles.infoCard} style={{marginBottom: '2rem'}}>
              <ul className={styles.cardList}>
                <li><strong>Minimum Time:</strong> 1-2 years of highly focused study.</li>
                <li><strong>Average Time:</strong> 3-5 years (including college base-building).</li>
                <li><strong>Exam Cycle:</strong> The exam itself takes 1 complete year from Prelims to Final Result.</li>
              </ul>
            </div>

            <h2 className={styles.sectionTitle}><span>📚</span> Study Guide</h2>
            <div className={styles.infoCard}>
              <h3 className={styles.cardTitle}>Daily Routine & Strategy</h3>
              <ul className={styles.cardList}>
                <li><strong>Base:</strong> NCERTs (6th to 12th)</li>
                <li><strong>Daily Action:</strong> Newspaper (The Hindu / Indian Express)</li>
                <li><strong>Core Books:</strong> Laxmikanth (Polity), Spectrum (Modern India)</li>
                <li><strong>Hours:</strong> 6–8 hours daily focused study</li>
                <li><strong>Testing:</strong> Weekend revision + mock tests</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Smart Tips & 11. Exams Details */ }
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div className={styles.infoCard}>
            <h2 className={styles.sectionTitle}><span>🧠</span> Smart Tips</h2>
            <ul className={styles.cardList}>
              <li><strong>Consistency &gt; Motivation:</strong> Roz padhna zaroori hai.</li>
              <li><strong>Make Short Notes:</strong> Mains revision ke liye khud ke notes best hote hain.</li>
              <li><strong>PYQs:</strong> Previous Year Questions solve karna is non-negotiable.</li>
              <li><strong>Test Series:</strong> Don&apos;t wait for syllabus completion, give tests early.</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h2 className={styles.sectionTitle}><span>🧪</span> Exam Details</h2>
            <ul className={styles.cardList}>
              <li><strong>Exam Name:</strong> UPSC Civil Services Examination (CSE)</li>
              <li><strong>Stages:</strong> Prelims (MCQ), Mains (Subjective), Interview (Personality Test)</li>
              <li><strong>Attempts limit:</strong> General (6), OBC (9), SC/ST (Unlimited till age limit)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 12, 13, 14, 15 */}
      <section className={styles.section}>
        <div className={styles.gridCards}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>🎤 Interview Process</h3>
            <p className={styles.careerDesc}>
              Yeh ek Personality test hota hai. Knowledge check Mains me ho chuki hai. Board aapka confidence, clarity of thought, aur crisis management judge karega. DAF (Detailed Application Form) aur Current Affairs strong hone chahiye.
            </p>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>💰 Salary & Growth</h3>
            <ul className={styles.cardList}>
              <li><strong>Starting (SDM):</strong> ₹56,100 + allowances</li>
              <li><strong>Mid-level (DM):</strong> ₹1,00,000+</li>
              <li><strong>Top level (Secretary):</strong> ₹2,50,000+ max scale</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>🎯 Skills Required</h3>
            <ul className={styles.cardList}>
              <li>Objective Decision making</li>
              <li>Strong Leadership & Empathy</li>
              <li>Clear Communication</li>
              <li>Problem solving under pressure</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>🔄 Backup Careers</h3>
            <ul className={styles.cardList}>
              <li>State PCS exams (similar syllabus)</li>
              <li>SSC CGL, RBI, Banking</li>
              <li>Academia, Teaching, Coaching</li>
              <li>Public Policy sector</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 16. FAQs Section (SEO) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle} style={{justifyContent: 'center', textAlign: 'center'}}>
          <span>❓</span> Frequently Asked Questions
        </h2>
        <FAQAccordion faqs={faqs} />
      </section>

      {/* 17. CTA Section */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to begin your UPSC journey?</h2>
        <p className={styles.heroDesc} style={{color: 'rgba(255,255,255,0.9)'}}>
          Take our daily quizzes and test your current affairs knowledge right now.
        </p>
        <div className={styles.ctaActions}>
          <Link href="/daily-current-affairs" className={styles.btnPrimary}>
            Start IAS Preparation Now 🔥
          </Link>
          <Link href="/daily" className={styles.btnSecondary}>
            Attempt Free Quiz 📊
          </Link>
        </div>
      </section>
    </div>
  );
}
