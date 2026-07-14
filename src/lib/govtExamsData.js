export const popularExamsData = [
  // SSC Category
  {
    id: "ssc",
    slug: "ssc",
    name: "SSC Exams (Master Hub)",
    emoji: "🦁",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "Combined selection portal for all Staff Selection Commission examinations including CGL, CHSL, MTS, and GD.",
    testCount: 45,
    subExams: ["SSC CGL", "SSC CHSL", "SSC GD Constable", "SSC MTS", "SSC JE", "SSC JE CE"]
  },
  {
    id: "ssc-cgl",
    slug: "ssc-cgl",
    name: "SSC CGL",
    emoji: "🏆",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "Combined Graduate Level Examination for Group B and Group C posts in central Ministries and Departments.",
    testCount: 20,
    subExams: ["Tier-I Full Mocks", "Tier-II Mocks", "Subject Tests"]
  },
  {
    id: "ssc-chsl",
    slug: "ssc-chsl",
    name: "SSC CHSL",
    emoji: "✍️",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "Combined Higher Secondary Level (10+2) for LDC, JSA, and Data Entry Operators.",
    testCount: 15,
    subExams: ["Tier-I Speed Mocks", "Topic Tests"]
  },
  {
    id: "ssc-gd-constable",
    slug: "ssc-gd-constable",
    name: "SSC GD Constable",
    emoji: "🛡️",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "General Duty Constable exam for BSF, CISF, CRPF, SSB, ITBP, and AR forces.",
    testCount: 12,
    subExams: ["Full-Length Tests", "Physical Prep Guides"]
  },
  {
    id: "ssc-mts",
    slug: "ssc-mts",
    name: "SSC MTS",
    emoji: "💼",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "Multi-Tasking Staff and Havaldar (CBIC & CBN) Recruitment Examination.",
    testCount: 10,
    subExams: ["Session I & II Practice Sets"]
  },
  {
    id: "ssc-je",
    slug: "ssc-je",
    name: "SSC JE",
    emoji: "⚙️",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "Junior Engineer Examination for Civil, Electrical, and Mechanical branches.",
    testCount: 8,
    subExams: ["Paper I Non-Tech", "Paper II Technical"]
  },
  {
    id: "ssc-je-ce",
    slug: "ssc-je-ce",
    name: "SSC JE CE",
    emoji: "🏗️",
    category: "SSC Exams",
    categoryId: "ssc-cat",
    description: "SSC Junior Engineer Civil Engineering specialized stream preparation.",
    testCount: 6,
    subExams: ["Civil Engineering Domain Tests"]
  },

  // Banking Category
  {
    id: "banking",
    slug: "banking",
    name: "Banking Exams (Master Hub)",
    emoji: "🏦",
    category: "Banking Exams",
    categoryId: "banking-cat",
    description: "Complete preparation portal for Officers and Clerical posts in Public Sector Banks and SBI.",
    testCount: 40,
    subExams: ["IBPS PO", "IBPS Clerk", "SBI PO", "SBI Clerk"]
  },
  {
    id: "ibps-po",
    slug: "ibps-po",
    name: "IBPS PO",
    emoji: "💰",
    category: "Banking Exams",
    categoryId: "banking-cat",
    description: "Institute of Banking Personnel Selection Probationary Officers & Management Trainees.",
    testCount: 18,
    subExams: ["Prelims Full Mocks", "Mains Speed Tests"]
  },
  {
    id: "ibps-clerk",
    slug: "ibps-clerk",
    name: "IBPS Clerk",
    emoji: "📋",
    category: "Banking Exams",
    categoryId: "banking-cat",
    description: "Clerical cadre recruitment in participating public sector banks across India.",
    testCount: 14,
    subExams: ["Prelims Speed Drills", "Reasoning & Quant Specials"]
  },
  {
    id: "sbi-po",
    slug: "sbi-po",
    name: "SBI PO",
    emoji: "📈",
    category: "Banking Exams",
    categoryId: "banking-cat",
    description: "State Bank of India Probationary Officer competitive exam.",
    testCount: 22,
    subExams: ["High-Level Prelims", "Mains & Descriptive Mocks"]
  },
  {
    id: "sbi-clerk",
    slug: "sbi-clerk",
    name: "SBI Clerk",
    emoji: "🏧",
    category: "Banking Exams",
    categoryId: "banking-cat",
    description: "Junior Associates (Customer Support & Sales) recruitment in SBI.",
    testCount: 16,
    subExams: ["Prelims Sectional Drills", "Memory-based Papers"]
  },

  // Railways Category
  {
    id: "railways",
    slug: "railways",
    name: "Railways Exams (Master Hub)",
    emoji: "🚆",
    category: "Railways Exams",
    categoryId: "railways-cat",
    description: "Indian Railways recruitment hub for Non-Technical, Group D, and Technical Engineering positions.",
    testCount: 35,
    subExams: ["RRB NTPC", "RRB Group D", "RRB JE"]
  },
  {
    id: "rrb-ntpc",
    slug: "rrb-ntpc",
    name: "RRB NTPC",
    emoji: "🚉",
    category: "Railways Exams",
    categoryId: "railways-cat",
    description: "Railway Recruitment Board Non-Technical Popular Categories (Graduate & Under Graduate).",
    testCount: 25,
    subExams: ["CBT-1 Practice Sets", "CBT-2 Advanced Mocks"]
  },
  {
    id: "rrb-group-d",
    slug: "rrb-group-d",
    name: "RRB Group D",
    emoji: "🔧",
    category: "Railways Exams",
    categoryId: "railways-cat",
    description: "Level-1 track maintainer, assistant and helper posts in Indian Railways.",
    testCount: 15,
    subExams: ["Computer Based Test Full Mocks"]
  },
  {
    id: "rrb-je",
    slug: "rrb-je",
    name: "RRB JE",
    emoji: "🚈",
    category: "Railways Exams",
    categoryId: "railways-cat",
    description: "Junior Engineer (Civil, Mechanical, Electrical, IT) recruitment in Indian Railways.",
    testCount: 12,
    subExams: ["CBT-1 General Science", "CBT-2 Technical Discipline"]
  },

  // Police Category
  {
    id: "police",
    slug: "police",
    name: "Police Exams (Master Hub)",
    emoji: "🚓",
    category: "Police Exams",
    categoryId: "police-cat",
    description: "State-wise Sub-Inspector and Constable recruitment exam portal for MP, UP, and major state cadres.",
    testCount: 30,
    subExams: ["MP SI", "MP Constable", "UP SI", "UP Constable"]
  },
  {
    id: "mp-si",
    slug: "mp-si",
    name: "MP SI",
    emoji: "👮",
    category: "Police Exams",
    categoryId: "police-cat",
    description: "Madhya Pradesh Police Sub-Inspector (Technical & Non-Technical) Recruitment.",
    testCount: 12,
    subExams: ["Paper I & II Mocks", "State GK Drills"]
  },
  {
    id: "mp-constable",
    slug: "mp-constable",
    name: "MP Constable",
    emoji: "🚔",
    category: "Police Exams",
    categoryId: "police-cat",
    description: "Madhya Pradesh Police Constable (GD & Radio) written test prep.",
    testCount: 10,
    subExams: ["Written Test Series", "Reasoning Speed Tests"]
  },
  {
    id: "up-si",
    slug: "up-si",
    name: "UP SI",
    emoji: "🕵️",
    category: "Police Exams",
    categoryId: "police-cat",
    description: "Uttar Pradesh Police Sub Inspector Civil Police & Platoon Commander.",
    testCount: 14,
    subExams: ["Basic Law & Constitution Mocks", "General Hindi Drills"]
  },
  {
    id: "up-constable",
    slug: "up-constable",
    name: "UP Constable",
    emoji: "🚨",
    category: "Police Exams",
    categoryId: "police-cat",
    description: "Uttar Pradesh Police Constable written examination master series.",
    testCount: 16,
    subExams: ["General Knowledge & Math Practice Sets"]
  }
];

export const examCategories = [
  { id: "all", name: "All Exams", icon: "🌍" },
  { id: "SSC Exams", name: "SSC Exams", icon: "🦁" },
  { id: "Banking Exams", name: "Banking Exams", icon: "🏦" },
  { id: "Railways Exams", name: "Railways Exams", icon: "🚆" },
  { id: "Police Exams", name: "Police Exams", icon: "🚓" }
];

export function getDetailedExamContent(slug) {
  const basicInfo = popularExamsData.find(e => e.slug === slug) || {
    id: slug,
    slug: slug,
    name: slug.toUpperCase().replace(/-/g, ' '),
    emoji: "🏛️",
    category: "Government Exams",
    description: `Official preparation and study portal for ${slug.toUpperCase().replace(/-/g, ' ')}.`,
    subExams: ["Full-Length Tests", "Topic Quizzes", "Previous Papers"]
  };

  const titleName = basicInfo.name;

  return {
    ...basicInfo,
    
    // TAB 1: EXAM DETAILS
    examDetails: {
      overview: `${titleName} is one of the most prestigious competitive examinations conducted across India. It serves as a Gateway for candidate recruitment into key government ministries, departments, and public sector organizations.`,
      eligibility: [
        { title: "Educational Qualification", desc: "Bachelor's Degree from a recognized University or equivalent (for Graduate level posts) / 10+2 Pass (for Higher Secondary level posts)." },
        { title: "Age Limit", desc: "18 to 30 years (Age relaxation applicable: 3 years for OBC, 5 years for SC/ST, 10 years for PwD as per official guidelines)." },
        { title: "Nationality", desc: "Must be a citizen of India, Subject of Nepal/Bhutan, or Tibetan refugee." }
      ],
      examPattern: [
        { stage: "Tier-I / CBT 1", mode: "Computer Based Test (Objective)", questions: 100, marks: 200, duration: "60 Minutes", subjects: "General Intelligence & Reasoning, General Awareness, Quantitative Aptitude, English Comprehension" },
        { stage: "Tier-II / CBT 2", mode: "Computer Based Test (Objective & Skill Test)", questions: 150, marks: 390, duration: "2 Hours 15 Minutes", subjects: "Mathematical Abilities, Reasoning, English Language, General Awareness, Computer Knowledge & Typing Test" }
      ],
      importantDates: [
        { event: "Official Notification Release", date: "June 2026" },
        { event: "Online Application Window", date: "June 2026 - July 2026" },
        { event: "Tier-I Admit Card Release", date: "August 2026" },
        { event: "Tier-I Examination Date", date: "September 2026" },
        { event: "Tier-I Answer Key & Result", date: "October 2026" },
        { event: "Tier-II Mains Examination", date: "December 2026" }
      ],
      payScaleOverview: [
        { payLevel: "Pay Level 7", basicPay: "₹44,900 to ₹1,42,400", posts: "Inspector (Central Excise, Income Tax, Examiner, Assistant Section Officer)" },
        { payLevel: "Pay Level 6", basicPay: "₹35,400 to ₹1,12,400", posts: "Executive Assistant, Assistant / Superintendent, Divisional Accountant" },
        { payLevel: "Pay Level 5", basicPay: "₹29,200 to ₹92,300", posts: "Auditor (CAG, CGDA), Senior Secretariat Assistant" },
        { payLevel: "Pay Level 4", basicPay: "₹25,500 to ₹81,100", posts: "Tax Assistant, Senior Clerk, Junior Accountant" }
      ]
    },

    // TAB 2: CAREER GUIDE
    careerGuide: {
      overview: `A career through ${titleName} offers job security, lucrative pay scales, prestige, and excellent long-term growth opportunities in public administration.`,
      highlights: [
        { label: "Starting In-Hand Salary", value: "₹45,000 - ₹75,000 / month", icon: "💰" },
        { label: "Job Security", value: "100% High Government Backup", icon: "🛡️" },
        { label: "Work-Life Balance", value: "Fixed 5-Day Work Week (9 AM - 5:30 PM)", icon: "⚖️" },
        { label: "Growth Hierarchy", value: "Regular Promotional Exams & Seniority", icon: "🚀" }
      ],
      salaryBreakdown: [
        { component: "Basic Pay", X_City: "₹44,900", Y_City: "₹44,900", Z_City: "₹44,900" },
        { component: "House Rent Allowance (HRA)", X_City: "₹12,123 (27%)", Y_City: "₹8,082 (18%)", Z_City: "₹4,041 (9%)" },
        { component: "Dearness Allowance (DA 50%)", X_City: "₹22,450", Y_City: "₹22,450", Z_City: "₹22,450" },
        { component: "Transport Allowance (TA + DA)", X_City: "₹5,400", Y_City: "₹2,700", Z_City: "₹2,700" },
        { component: "Gross Monthly Salary", X_City: "₹84,873", Y_City: "₹78,132", Z_City: "₹74,091" },
        { component: "Approx Net Take Home", X_City: "₹74,500+", Y_City: "₹69,000+", Z_City: "₹65,000+" }
      ],
      growthPathway: [
        { stage: "Entry Level (Years 0-3)", title: "Assistant Section Officer / Inspector", desc: "Executive execution, file handling, field investigations, and operational reporting." },
        { stage: "Mid Level (Years 4-8)", title: "Section Officer / Superintendent", desc: "Supervising unit teams, policy draft verifications, leading local raids/audits." },
        { stage: "Senior Level (Years 9-15)", title: "Under Secretary / Deputy Director", desc: "Administrative control, department policy decisions, inter-ministerial liaison." },
        { stage: "Apex Executive (Years 16+)", title: "Director / Joint Commissioner", desc: "High-level strategic governance and division leadership." }
      ],
      workLifeCulture: "Officers enjoy fixed working hours (9:30 AM to 5:30 PM), gazetted holidays, earned leaves (30 days/yr), medical insurance under CGHS, LTC (Leave Travel Concession), and official housing quarter allotments."
    },

    // TAB 3: SYLLABUS
    syllabus: [
      {
        subject: "General Intelligence & Reasoning",
        topics: [
          "Analogies & Classification (Verbal and Non-Verbal)",
          "Coding & Decoding (Letter, Number, Symbol Based)",
          "Blood Relations, Direction Sense & Seating Arrangement",
          "Syllogism, Statement & Assumptions, Critical Reasoning",
          "Matrix, Paper Folding, Pattern Completion & Embedded Figures"
        ]
      },
      {
        subject: "Quantitative Aptitude (Mathematics)",
        topics: [
          "Number System, Simplification, HCF & LCM",
          "Percentage, Profit & Loss, Simple & Compound Interest",
          "Ratio & Proportion, Average, Time & Work, Speed Distance & Time",
          "Algebraic Identities, Polynomials & Linear Equations",
          "Geometry, Triangles, Circles, Mensuration (2D/3D) & Trigonometry",
          "Data Interpretation (Bar Graphs, Pie Charts, Tables & Line Graphs)"
        ]
      },
      {
        subject: "General Awareness & Static GK",
        topics: [
          "Indian History: Ancient, Medieval, and Modern Freedom Movement",
          "Indian Polity: Constitution, Fundamental Rights, Parliament & Judiciary",
          "Geography: Physical Features, Rivers, Climate, Agriculture & Minerals",
          "Indian Economy: Budget, National Income, Banking & Inflation",
          "General Science: Physics, Chemistry & Biology (Class 10 level)",
          "Static GK & Current Affairs: National Awards, Sports, Schemes & Summits"
        ]
      },
      {
        subject: "English Language & Comprehension",
        topics: [
          "Grammar: Spotting Errors, Fill in the Blanks, Sentence Improvement",
          "Vocabulary: Synonyms, Antonyms, One Word Substitutions, Idioms & Phrases",
          "Spellings & Misspelt Words",
          "Reading Comprehension: Narrative & Analytical Passages, Cloze Test",
          "Active/Passive Voice & Direct/Indirect Speech conversion"
        ]
      }
    ],

    // TAB 4: STUDY MATERIALS (Interactive Digital FlexBook)
    studyBook: {
      title: `${titleName} Official Digital Study Guide`,
      description: "Interactive FlexBook designed with structured theory, visual diagrams, and instant chapter practice quizzes.",
      subjects: [
        {
          id: "general-awareness",
          name: "General Awareness & Polity",
          icon: "⚖️",
          chapters: [
            {
              id: "polity-ch1",
              slug: "polity-constitution-preamble",
              title: "Chapter 1: Indian Polity - Preamble & Fundamental Rights",
              readTime: "15 Mins",
              theoryContent: `
                <h3>1. Introduction to the Constitution of India</h3>
                <p>The Constitution of India is the supreme law of India. It lays down the framework defining fundamental political principles, establishes the structure, procedures, powers, and duties of government institutions, and sets out fundamental rights, directive principles, and duties of citizens.</p>
                
                <div class="theory-image-card">
                  <div class="theory-img-box">
                    <svg viewBox="0 0 400 180" class="w-full h-auto">
                      <rect width="400" height="180" rx="16" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
                      <circle cx="80" cy="90" r="50" fill="#6366F1" opacity="0.1"/>
                      <text x="80" y="95" text-anchor="middle" font-weight="bold" fill="#4F46E5" font-size="28">📜</text>
                      <text x="160" y="65" font-weight="bold" fill="#0F172A" font-size="16">Preamble Principles</text>
                      <text x="160" y="90" fill="#475569" font-size="13">• Sovereign, Socialist, Secular</text>
                      <text x="160" y="112" fill="#475569" font-size="13">• Democratic Republic</text>
                      <text x="160" y="134" fill="#475569" font-size="13">• Justice, Liberty, Equality, Fraternity</text>
                    </svg>
                  </div>
                  <p class="caption">Figure 1.1: Core Pillars of the Indian Preamble</p>
                </div>

                <h3>2. Key Fundamental Rights (Articles 12-35)</h3>
                <table class="concept-table">
                  <thead>
                    <tr><th>Right Category</th><th>Articles</th><th>Key Highlights</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Right to Equality</td><td>Articles 14–18</td><td>Equality before law, Prohibition of discrimination</td></tr>
                    <tr><td>Right to Freedom</td><td>Articles 19–22</td><td>Freedom of speech, assembly, protection of life</td></tr>
                    <tr><td>Right against Exploitation</td><td>Articles 23–24</td><td>Prohibition of human trafficking and child labour</td></tr>
                    <tr><td>Right to Freedom of Religion</td><td>Articles 25–28</td><td>Freedom of conscience and religious management</td></tr>
                  </tbody>
                </table>
              `,
              chapterQuiz: {
                title: "Chapter 1 Self-Assessment Quiz",
                questions: [
                  {
                    id: 1,
                    text: "Which Article of the Constitution guarantees the Right to Equality before Law?",
                    options: ["Article 14", "Article 19", "Article 21", "Article 32"],
                    answer: 0,
                    explanation: "Article 14 guarantees equality before law and equal protection of laws within India."
                  },
                  {
                    id: 2,
                    text: "The terms 'Socialist' and 'Secular' were added to the Preamble by which Amendment?",
                    options: ["44th Amendment", "42nd Amendment", "86th Amendment", "73rd Amendment"],
                    answer: 1,
                    explanation: "The 42nd Constitutional Amendment Act of 1976 added the terms Socialist, Secular, and Integrity."
                  }
                ]
              }
            },
            {
              id: "polity-ch2",
              slug: "indian-history-freedom-movement",
              title: "Chapter 2: Modern Indian History & Freedom Movement",
              readTime: "20 Mins",
              theoryContent: `
                <h3>1. Revolt of 1857 & The Indian National Congress</h3>
                <p>The Revolt of 1857, also known as the First War of Indian Independence, marked a major turning point. The Indian National Congress (INC) was subsequently founded in 1885 by A.O. Hume, W.C. Bonnerjee presiding over the first session in Bombay.</p>

                <div class="theory-image-card">
                  <div class="theory-img-box">
                    <svg viewBox="0 0 400 180" class="w-full h-auto">
                      <rect width="400" height="180" rx="16" fill="#FFFBEB" stroke="#FDE68A" stroke-width="2"/>
                      <text x="200" y="50" text-anchor="middle" font-weight="bold" fill="#92400E" font-size="18">Timeline of Freedom Struggle</text>
                      <line x1="50" y1="100" x2="350" y2="100" stroke="#D97706" stroke-width="4"/>
                      <circle cx="80" cy="100" r="8" fill="#D97706"/>
                      <text x="80" y="130" text-anchor="middle" fill="#78350F" font-size="12" font-weight="bold">1857 Revolt</text>
                      <circle cx="180" cy="100" r="8" fill="#D97706"/>
                      <text x="180" y="130" text-anchor="middle" fill="#78350F" font-size="12" font-weight="bold">1885 INC</text>
                      <circle cx="280" cy="100" r="8" fill="#D97706"/>
                      <text x="280" y="130" text-anchor="middle" fill="#78350F" font-size="12" font-weight="bold">1942 Quit India</text>
                    </svg>
                  </div>
                  <p class="caption">Figure 2.1: Key Milestones of the Indian Independence Era</p>
                </div>
              `,
              chapterQuiz: {
                title: "Chapter 2 Practice Assessment",
                questions: [
                  {
                    id: 1,
                    text: "Who presided over the first session of the Indian National Congress in 1885?",
                    options: ["A.O. Hume", "W.C. Bonnerjee", "Dadabhai Naoroji", "Gopal Krishna Gokhale"],
                    answer: 1,
                    explanation: "Womesh Chandra Bonnerjee was the first president of the INC session held in Bombay."
                  }
                ]
              }
            }
          ]
        },
        {
          id: "quantitative-aptitude",
          name: "Quantitative Aptitude & Mathematics",
          icon: "➕",
          chapters: [
            {
              id: "quant-ch1",
              slug: "percentage-profit-loss",
              title: "Chapter 1: Percentages, Profit & Loss Shortcuts",
              readTime: "18 Mins",
              theoryContent: `
                <h3>1. Fundamental Formulae of Percentages</h3>
                <p>Percentage is a fraction expressed per 100. Memory values for standard fraction-to-percentage conversions speed up exam solution time drastically.</p>
                
                <div class="theory-image-card">
                  <div class="theory-img-box">
                    <svg viewBox="0 0 400 180" class="w-full h-auto">
                      <rect width="400" height="180" rx="16" fill="#EEF2FF" stroke="#C7D2FE" stroke-width="2"/>
                      <text x="200" y="45" text-anchor="middle" font-weight="bold" fill="#3730A3" font-size="18">Fraction Memory Table</text>
                      <text x="100" y="90" font-weight="bold" fill="#1E1B4B" font-size="14">1/2 = 50%</text>
                      <text x="100" y="125" font-weight="bold" fill="#1E1B4B" font-size="14">1/3 = 33.33%</text>
                      <text x="200" y="90" font-weight="bold" fill="#1E1B4B" font-size="14">1/4 = 25%</text>
                      <text x="200" y="125" font-weight="bold" fill="#1E1B4B" font-size="14">1/5 = 20%</text>
                      <text x="300" y="90" font-weight="bold" fill="#1E1B4B" font-size="14">1/6 = 16.66%</text>
                      <text x="300" y="125" font-weight="bold" fill="#1E1B4B" font-size="14">1/8 = 12.5%</text>
                    </svg>
                  </div>
                  <p class="caption">Figure 3.1: Standard Speed Fractions for Quantitative Aptitude</p>
                </div>
              `,
              chapterQuiz: {
                title: "Chapter 1 Quantitative Speed Test",
                questions: [
                  {
                    id: 1,
                    text: "If a seller sells an item for ₹1200 making a profit of 20%, what was the Cost Price (CP)?",
                    options: ["₹1000", "₹960", "₹1040", "₹1100"],
                    answer: 0,
                    explanation: "CP = SP / (1 + Profit%) = 1200 / 1.2 = ₹1000."
                  }
                ]
              }
            }
          ]
        }
      ]
    },

    // TAB 5: QUIZZES ACTION META
    quizzesAction: {
      redirectUrl: "/quizzes?tab=govt",
      label: "Start Practice Quizzes",
      description: "Access topic-wise speed quizzes for Govt Exam Preparation."
    },

    // TAB 6: MOCK TESTS ACTION META
    mockTestsAction: {
      redirectUrl: `/mock-tests`,
      label: "Start Full Length Mock Tests",
      description: `Take official full-length simulated exam papers for ${titleName}.`
    },

    // TAB 7: FORUM ACTION META
    forumAction: {
      redirectUrl: `/forum`,
      label: "Join Community Forum",
      description: `Connect with candidates, ask questions, discuss previous cut-offs, and share strategies for ${titleName}.`
    }
  };
}
