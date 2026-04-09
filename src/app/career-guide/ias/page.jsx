import Link from "next/link";
import styles from "@/styles/CareerGuide.module.css";
import FAQAccordion from "@/components/FAQAccordion";
import LanguageToggle from "@/components/LanguageToggle";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({ searchParams }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: "ias" },
  });

  if (!guide) return { title: "IAS Career Guide" };

  const isHi = searchParams?.lang === "hi";
  const name = (isHi && guide.nameHi) ? guide.nameHi : guide.name;
  return {
    title: `${name} | Step-by-Step Roadmap & Salary`,
    description: (isHi && guide.descriptionHi) ? guide.descriptionHi : guide.description,
  };
}

export default async function IASCareerGuide({ searchParams }) {
  const guide = await prisma.careerGuide.findUnique({
    where: { slug: "ias" },
    include: { sections: { orderBy: { sortOrder: 'asc' } } }
  });

  if (!guide) notFound();

  const isHi = searchParams?.lang === "hi";

  // Map database fields to the UI with fallbacks to the hardcoded version if needed
  const dName = (isHi && guide.nameHi?.trim()) ? guide.nameHi : guide.name;
  const dDesc = (isHi && guide.descriptionHi?.trim()) ? guide.descriptionHi : guide.description;
  const dDiff = (isHi && guide.difficultyHi?.trim()) ? guide.difficultyHi : guide.difficulty;
  const dComp = (isHi && guide.competitionHi?.trim()) ? guide.competitionHi : guide.competition;
  const dSal = (isHi && guide.avgSalaryHi?.trim()) ? guide.avgSalaryHi : guide.avgSalary;
  const dWork = (isHi && guide.workTypeHi?.trim()) ? guide.workTypeHi : guide.workType;

  // Final strings for UI elements that might not be in the DB
  const tDifficulty = isHi ? "कठिनाई स्तर" : "Difficulty Level";
  const tCompetition = isHi ? "प्रतियोगिता" : "Competition";
  const tSalary = isHi ? "औसत वेतन" : "Average Salary";
  const tWorkType = isHi ? "कार्य प्रकार" : "Work Type";

  const faqs = (guide.sections || []).filter(s => s.type === "FAQS").map(s => {
      const content = (isHi && s.contentHi) ? s.contentHi : s.content;
      try {
          return JSON.parse(content || "[]");
      } catch {
          return [];
      }
  }).flat();

  // If no DB FAQs, fallback to hardcoded ones
  const finalFaqs = faqs.length > 0 ? faqs : [
    { question: isHi ? "IAS बनने के लिए न्यूनतम योग्यता क्या है?" : "IAS banne ke liye minimum qualification kya hai?", answer: isHi ? "ग्रेजुएशन अनिवार्य है। आप किसी भी स्ट्रीम से स्नातक हों, आप UPSC दे सकते हैं।" : "Graduation required hai. Aapne kisi bhi stream (Arts, Commerce, Science) se graduation kiya ho, aap UPSC de sakte hain." },
    { question: isHi ? "IAS बनने में कितना समय लगता है?" : "IAS banne me kitna time lagta hai?", answer: isHi ? "आमतौर पर 2-5 साल लग सकते हैं, औसत 3-5 वर्ष।" : "Syllabus cover karne aur exam clear karne me generally 2-5 saal lag sakte hain, average 3-5 years lagte hain." },
    // ... more items can be added here or just rely on DB
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": finalFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
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
        <span className={styles.categoryTag}>{isHi ? "सरकारी नौकरी" : "Government Job"}</span>
        <h1 className={styles.heroTitle}>
          {guide.icon} {dName}
        </h1>
        <p className={styles.heroDesc}>{dDesc}</p>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tDifficulty}</div>
            <div className={styles.statValue}>{dDiff}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tCompetition}</div>
            <div className={styles.statValue}>{dComp}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tSalary}</div>
            <div className={styles.statValue}>{dSal}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{tWorkType}</div>
            <div className={styles.statValue}>{dWork}</div>
          </div>
        </div>
      </section>

      {/* 3 & 4. Why Choose & Who Should Avoid */}
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div className={styles.prosCard}>
            <h2 className={styles.sectionTitle}><span>🎯</span> {isHi ? "IAS क्यों चुनें?" : "Why Choose IAS?"}</h2>
            <ul className={styles.prosConsList}>
              {isHi ? (
                <>
                  <li><span>✅</span> समाज में उच्च सम्मान और शक्ति</li>
                  <li><span>🛡️</span> असाधारण नौकरी सुरक्षा</li>
                  <li><span>🌍</span> लोगों के जीवन पर सीधा प्रभाव</li>
                  <li><span>💼</span> अच्छा वेतन और सुविधाएं</li>
                  <li><span>👑</span> शीर्ष स्तरीय नेतृत्व भूमिकाएं</li>
                </>
              ) : (
                <>
                  <li><span>✅</span> High respect & power in society</li>
                  <li><span>🛡️</span> Exceptional Job security</li>
                  <li><span>🌍</span> Direct impact on people&apos;s lives</li>
                  <li><span>💼</span> Good salary + perks (house, car, staff)</li>
                  <li><span>👑</span> Top-level Leadership roles</li>
                </>
              )}
            </ul>
          </div>
          <div className={styles.consCard}>
            <h2 className={styles.sectionTitle}><span>🚫</span> {isHi ? "किसे बचना चाहिए?" : "Who Should Avoid?"}</h2>
            <ul className={styles.prosConsList}>
              {isHi ? (
                  <>
                    <li><span>💸</span> जो सिर्फ पैसा कमाने के लिए आ रहे हैं</li>
                    <li><span>⏳</span> जिनके पास बिल्कुल धैर्य नहीं है</li>
                    <li><span>📚</span> जो लंबे समय तक तैयारी नहीं कर सकते</li>
                    <li><span>⚖️</span> जो तनाव या दबाव नहीं झेल सकते</li>
                  </>
              ) : (
                <>
                  <li><span>💸</span> Jo sirf paisa kamane ke liye aa rahe hain</li>
                  <li><span>⏳</span> Jinke paas patience bilkul nahi hai</li>
                  <li><span>📚</span> Jo long-term continuous preparation nahi kar sakte</li>
                  <li><span>⚖️</span> Jo stress ya high pressure handle nahi kar sakte</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. What You Will Become */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>👨‍💼</span> {isHi ? "आप क्या बनेंगे" : "What You Will Become"}</h2>
        <div className={styles.gridCards}>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>{isHi ? "शीर्ष भूमिकाएं" : "Top Roles"}</h3>
            <ul className={styles.cardList}>
              <li>{isHi ? "जिला मजिस्ट्रेट (DM)" : "District Magistrate (DM)"}</li>
              <li>{isHi ? "कलेक्टर" : "Collector"}</li>
              <li>{isHi ? "नीति निर्माता" : "Policy Maker"}</li>
              <li>{isHi ? "वरिष्ठ सरकारी प्रशासक" : "Senior Government Administrator"}</li>
            </ul>
          </div>
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>{isHi ? "दैनंदिन कार्य / दिनचर्या" : "Daily Work / Routine"}</h3>
            <ul className={styles.cardList}>
              <li>{isHi ? "कानून और व्यवस्था बनाए रखना" : "Law & order manage karna"}</li>
              <li>{isHi ? "सरकारी योजनाओं को लागू करना" : "Government schemes ko district me implement karna"}</li>
              <li>{isHi ? "जनता की समस्याओं का समाधान" : "Public issues aur grievances solve karna"}</li>
              <li>{isHi ? "विभिन्न विभागों की बैठकें लेना" : "Various departments ki meetings lena"}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Inspiration Section - Keep design exactly same, only toggle language if DB has it */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><span>🌟</span> {isHi ? "प्रेरणादायक कहानियाँ" : "Inspiration Stories"}</h2>
        <div className={styles.storyGrid}>
          <div className={styles.storyCard}>
            <div className={styles.quoteIcon}>&quot;</div>
            <div className={styles.storyBg}>{isHi ? "मध्यम वर्गीय परिवार" : "Middle-class Family"}</div>
            <h3 className={styles.cardTitle}>{isHi ? "निरंतरता की शक्ति" : "The Power of Consistency"}</h3>
            <p className={styles.storyStruggle}>
              {isHi 
                ? "प्रारंभिक परीक्षा में 3 बार असफल। तैयारी के लिए अंशकालिक काम किया। चौथे प्रयास में शीर्ष रैंक के साथ सफल।"
                : "Failed 3 times in Prelims. Worked a part-time job to support preparation. Cleared in the 4th attempt with top rank."}
            </p>
            <div className={styles.storyLearning}>
              <div className={styles.learningLabel}>{isHi ? "मुख्य सीख:" : "Key Learning:"}</div>
              <div className={styles.learningText}>{isHi ? "निरंतरता ही सफलता की कुंजी है। सपनों को कभी न छोड़ें।" : "Consistency is key. Never give up on your dreams."}</div>
            </div>
          </div>
          <div className={styles.storyCard}>
            <div className={styles.quoteIcon}>&quot;</div>
            <div className={styles.storyBg}>{isHi ? "ग्रामीण पृष्ठभूमि" : "Village Background"}</div>
            <h3 className={styles.cardTitle}>{isHi ? "स्व-अध्ययन की जीत" : "Self-Study Triumph"}</h3>
            <p className={styles.storyStruggle}>
              {isHi
                ? "छोटे गांव का हिंदी माध्यम छात्र, बिना प्रीमियम कोचिंग के। पूरी तरह से मानक किताबों और इंटरनेट पर भरोसा किया।"
                : "Hindi medium student from a small village with zero access to premium coaching. Relied purely on standard books and internet."}
            </p>
            <div className={styles.storyLearning}>
              <div className={styles.learningLabel}>{isHi ? "मुख्य सीख:" : "Key Learning:"}</div>
              <div className={styles.learningText}>{isHi ? "सही रणनीति + स्व-अध्ययन > महंगी कोचिंग।" : "Right strategy + Self-study > Expensive coaching."}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Roadmap & 9. Time Required */}
      <section className={styles.section}>
        <div className={styles.twoCol}>
          <div>
            <h2 className={styles.sectionTitle}><span>🛤️</span> {isHi ? "पूर्ण रोडमैप" : "Complete Roadmap"}</h2>
            <div className={styles.roadmapStepper}>
              <div className={styles.stepperItem}>
                <div className={styles.stepperIcon}>1</div>
                <div className={styles.stepperContent}>
                  <h3 className={styles.stepperTitle}>{isHi ? "10वीं के बाद" : "After 10th"}</h3>
                  <p className={styles.careerDesc}>{isHi ? "कोई भी स्ट्रीम ले सकते हैं। NCERTs के साथ बेसिक्स बनाएं और अखबार पढ़ें।" : "Koi bhi stream le sakte ho (Arts, Science, Commerce). Focus on building basics with NCERTs and read newspapers."}</p>
                </div>
              </div>
              <div className={styles.stepperItem}>
                <div className={styles.stepperIcon}>2</div>
                <div className={styles.stepperContent}>
                  <h3 className={styles.stepperTitle}>{isHi ? "12वीं और ग्रेजुएशन के बाद" : "After 12th & Graduation"}</h3>
                  <p className={styles.careerDesc}>{isHi ? "ग्रेजुएशन जारी रखें। मुख्य विषयों (पॉलिटी, हिस्ट्री) की मानक किताबें शुरू करें।" : "Graduation continue karo. Core subjects (Polity, History) ke standard books start karo. Optional subject decide karo."}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className={styles.sectionTitle}><span>⏳</span> {isHi ? "आवश्यक समय" : "Time Required"}</h2>
            <div className={styles.infoCard} style={{marginBottom: '2rem'}}>
              <ul className={styles.cardList}>
                <li><strong>{isHi ? "न्यूनतम समय:" : "Minimum Time:"}</strong> {isHi ? "1-2 साल गहन अध्ययन।" : "1-2 years of highly focused study."}</li>
                <li><strong>{isHi ? "औसत समय:" : "Average Time:"}</strong> {isHi ? "3-5 साल (कॉलेज के साथ)।" : "3-5 years (including college base-building)."}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 16. FAQs Section from DB */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle} style={{justifyContent: 'center', textAlign: 'center'}}>
          <span>❓</span> {isHi ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}
        </h2>
        <FAQAccordion faqs={finalFaqs} />
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
