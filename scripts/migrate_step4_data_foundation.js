const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

// 15 Standard Categories with 10 Topics each
const TAXONOMY_DEFINITIONS = [
  {
    slug: "history",
    name: "Indian & World History",
    nameHi: "इतिहास",
    description: "Ancient, Medieval, Modern Indian history and World historical events",
    descriptionHi: "प्राचीन, मध्यकालीन, आधुनिक भारतीय इतिहास एवं विश्व इतिहास",
    icon: "landmark",
    audience: ["students", "explorer"],
    sortOrder: 1,
    topics: [
      { slug: "ancient-india", name: "Ancient India & Indus Valley", nameHi: "प्राचीन भारत व सिंधु सभ्यता", tags: ["history", "ancient", "indus", "vedic"] },
      { slug: "medieval-india", name: "Medieval India & Delhi Sultanate", nameHi: "मध्यकालीन भारत व सल्तनत काल", tags: ["history", "medieval", "sultanate"] },
      { slug: "mughal-empire", name: "Mughal Empire & Regional Kingdoms", nameHi: "मुगल साम्राज्य व क्षेत्रीय रियासतें", tags: ["history", "mughal", "maratha"] },
      { slug: "modern-india", name: "Modern India & British Rule", nameHi: "आधुनिक भारत व ब्रिटिश शासन", tags: ["history", "modern", "british"] },
      { slug: "freedom-struggle", name: "Freedom Struggle & 1857 Revolt", nameHi: "भारतीय स्वतंत्रता संग्राम व 1857 क्रांति", tags: ["history", "freedom", "1857", "gandhi"] },
      { slug: "post-independence", name: "Post-Independence India", nameHi: "स्वतंत्रता के बाद का भारत", tags: ["history", "post-independence", "wars"] },
      { slug: "world-history", name: "World History & Civilizations", nameHi: "विश्व इतिहास व प्रमुख सभ्यताएं", tags: ["history", "world", "revolutions"] },
      { slug: "famous-battles", name: "Historic Battles & Treaties", nameHi: "प्रसिद्ध युद्ध, संधियां व समझौते", tags: ["history", "battles", "treaties"] },
      { slug: "social-reforms", name: "Socio-Religious Reform Movements", nameHi: "सामाजिक-धार्मिक सुधार आंदोलन", tags: ["history", "reforms", "renaissance"] },
      { slug: "historical-monuments", name: "Monuments & Heritage Architecture", nameHi: "ऐतिहासिक स्मारक व स्थापत्य", tags: ["history", "monuments", "architecture"] }
    ]
  },
  {
    slug: "geography",
    name: "Geography & Environment",
    nameHi: "भूगोल एवं पर्यावरण",
    description: "Indian physical geography, world geography, climates and ecology",
    descriptionHi: "भारतीय भौतिक भूगोल, विश्व भूगोल, जलवायु एवं पारिस्थितिकी",
    icon: "globe",
    audience: ["students", "explorer"],
    sortOrder: 2,
    topics: [
      { slug: "physical-geography-india", name: "Indian Physical Geography", nameHi: "भारत का भौतिक स्वरूप", tags: ["geography", "india", "landforms"] },
      { slug: "rivers-lakes", name: "Rivers, Lakes & Water Bodies", nameHi: "भारत की नदियाँ व झीलें", tags: ["geography", "rivers", "lakes", "dams"] },
      { slug: "mountains-passes", name: "Mountains, Plateaus & Passes", nameHi: "पर्वत, पठार व दर्रे", tags: ["geography", "mountains", "himalayas", "passes"] },
      { slug: "climate-monsoon", name: "Climate, Weather & Monsoons", nameHi: "जलवायु, मौसम व मानसून", tags: ["geography", "climate", "monsoon"] },
      { slug: "soils-agriculture", name: "Soils, Crops & Agriculture", nameHi: "मृदा, प्रमुख फसलें व कृषि", tags: ["geography", "soils", "agriculture", "crops"] },
      { slug: "minerals-industries", name: "Minerals, Energy & Industries", nameHi: "खनिज संसाधन व उद्योग", tags: ["geography", "minerals", "resources", "industries"] },
      { slug: "forests-wildlife", name: "Forests, National Parks & Sanctuaries", nameHi: "वन, राष्ट्रीय उद्यान व अभयारण्य", tags: ["geography", "forests", "wildlife", "parks"] },
      { slug: "world-geography", name: "Continents, Oceans & World Geography", nameHi: "महाद्वीप, महासागर व विश्व भूगोल", tags: ["geography", "world", "oceans"] },
      { slug: "solar-system", name: "Solar System & Universe", nameHi: "सौरमंडल, ग्रह व ब्रह्मांड", tags: ["geography", "space", "solar-system", "astronomy"] },
      { slug: "ecology-environment", name: "Ecology, Climate Change & Biodiversity", nameHi: "पारिस्थितिकी व पर्यावरण", tags: ["geography", "ecology", "environment", "biodiversity"] }
    ]
  },
  {
    slug: "polity",
    name: "Indian Polity & Constitution",
    nameHi: "भारतीय राजव्यवस्था व संविधान",
    description: "Constitution of India, Parliament, Judiciary and Governance",
    descriptionHi: "भारतीय संविधान, संसद, न्यायपालिका एवं शासन व्यवस्था",
    icon: "shield",
    audience: ["students", "explorer"],
    sortOrder: 3,
    topics: [
      { slug: "constitution-preamble", name: "Constitution Framing & Preamble", nameHi: "संविधान निर्माण व प्रस्तावना", tags: ["polity", "constitution", "preamble"] },
      { slug: "fundamental-rights", name: "Fundamental Rights & Duties", nameHi: "मौलिक अधिकार व कर्तव्य", tags: ["polity", "rights", "duties", "dpsp"] },
      { slug: "president-governor", name: "President, PM & Governor", nameHi: "राष्ट्रपति, प्रधानमंत्री व राज्यपाल", tags: ["polity", "president", "executive", "governor"] },
      { slug: "parliament-legislation", name: "Parliament & State Assemblies", nameHi: "संसद व राज्य विधानमंडल", tags: ["polity", "parliament", "lok-sabha", "rajya-sabha"] },
      { slug: "judiciary-courts", name: "Supreme Court & High Courts", nameHi: "न्यायपालिका व सर्वोच्च न्यायालय", tags: ["polity", "judiciary", "supreme-court"] },
      { slug: "panchayati-raj", name: "Panchayati Raj & Local Governance", nameHi: "पंचायती राज व स्थानीय स्वशासन", tags: ["polity", "panchayat", "municipalities"] },
      { slug: "constitutional-bodies", name: "Election Commission & Constitutional Bodies", nameHi: "चुनाव आयोग व सांविधिक निकाय", tags: ["polity", "election-commission", "upsc", "cag"] },
      { slug: "amendments-articles", name: "Key Amendments & Articles", nameHi: "प्रमुख संविधान संशोधन व महत्वपूर्ण अनुच्छेद", tags: ["polity", "amendments", "articles"] },
      { slug: "centre-state-relations", name: "Centre-State Relations & Emergency", nameHi: "केंद्र-राज्य संबंध व आपातकालीन प्रावधान", tags: ["polity", "emergency", "federalism"] },
      { slug: "public-policy-rights", name: "Public Policy & Citizens' Rights", nameHi: "लोक नीति व नागरिक अधिकार", tags: ["polity", "policies", "rti", "governance"] }
    ]
  },
  {
    slug: "economy",
    name: "Indian Economy & Banking",
    nameHi: "भारतीय अर्थव्यवस्था व बैंकिंग",
    description: "Economic concepts, RBI, Union Budget, Banking and Markets",
    descriptionHi: "आर्थिक अवधारणाएं, आरबीआई, केंद्रीय बजट, बैंकिंग व वित्तीय बाजार",
    icon: "trending-up",
    audience: ["students", "explorer"],
    sortOrder: 4,
    topics: [
      { slug: "economic-basics", name: "Basic Concepts of Economics", nameHi: "अर्थशास्त्र की मूल अवधारणाएं", tags: ["economy", "basics", "gdp", "national-income"] },
      { slug: "budget-fiscal", name: "Union Budget & Fiscal Policy", nameHi: "केंद्रीय बजट व राजकोषीय नीति", tags: ["economy", "budget", "fiscal-policy"] },
      { slug: "banking-rbi", name: "Banking System & RBI", nameHi: "बैंकिंग व्यवस्था व रिजर्व बैंक", tags: ["economy", "banking", "rbi", "monetary-policy"] },
      { slug: "inflation-monetary", name: "Inflation, Deflation & Currency", nameHi: "मुद्रास्फीति, मूल्य सूचकांक व मुद्रा", tags: ["economy", "inflation", "cpi", "wpi"] },
      { slug: "taxation-gst", name: "Indian Tax Structure & GST", nameHi: "भारतीय कर प्रणाली व जीएसटी", tags: ["economy", "taxation", "gst", "direct-tax"] },
      { slug: "five-year-plans", name: "Planning in India & NITI Aayog", nameHi: "भारत में योजनाएं व नीति आयोग", tags: ["economy", "niti-aayog", "planning"] },
      { slug: "agriculture-rural", name: "Agriculture, Subsidies & Rural Economy", nameHi: "कृषि अर्थशास्त्र व ग्रामीण विकास", tags: ["economy", "agriculture", "rural", "subsidies"] },
      { slug: "foreign-trade", name: "International Trade, WTO & Forex", nameHi: "विदेशी व्यापार, डब्ल्यूटीओ व विदेशी मुद्रा", tags: ["economy", "trade", "wto", "forex"] },
      { slug: "stock-market", name: "Capital Markets & Financial Institutions", nameHi: "शेयर बाजार, सेबी व वित्तीय बाजार", tags: ["economy", "stock-market", "sebi", "capital-market"] },
      { slug: "govt-schemes-economy", name: "Economic Schemes & Poverty Alleviation", nameHi: "आर्थिक योजनाएं व निर्धनता उन्मूलन", tags: ["economy", "schemes", "poverty", "employment"] }
    ]
  },
  {
    slug: "general-science",
    name: "General Science",
    nameHi: "सामान्य विज्ञान",
    description: "Physics, Chemistry, Biology and Everyday Science discoveries",
    descriptionHi: "भौतिकी, रसायन, जीव विज्ञान एवं दैनिक विज्ञान के आविष्कार",
    icon: "atom",
    audience: ["students", "explorer", "kids"],
    sortOrder: 5,
    topics: [
      { slug: "mechanics-motion", name: "Mechanics, Motion & Force", nameHi: "यांत्रिकी, गति व बल", tags: ["science", "physics", "motion", "force"] },
      { slug: "heat-light-sound", name: "Heat, Light & Sound", nameHi: "ऊष्मा, प्रकाश व ध्वनि", tags: ["science", "physics", "light", "sound", "optics"] },
      { slug: "electricity-magnetism", name: "Electricity & Magnetism", nameHi: "विद्युत व चुंबकत्व", tags: ["science", "physics", "electricity", "magnetism"] },
      { slug: "chemical-reactions", name: "Elements, Compounds & Reactions", nameHi: "तत्व, यौगिक व रासायनिक अभिक्रियाएं", tags: ["science", "chemistry", "reactions"] },
      { slug: "acids-bases-metals", name: "Acids, Bases & Metals/Non-Metals", nameHi: "अम्ल, क्षार, धातु व अधातु", tags: ["science", "chemistry", "metals", "acids"] },
      { slug: "human-anatomy", name: "Human Body & Physiology", nameHi: "मानव शरीर व तंत्र", tags: ["science", "biology", "human-body", "anatomy"] },
      { slug: "diseases-nutrition", name: "Diseases, Vitamins & Nutrition", nameHi: "रोग, विटामिन व पोषण", tags: ["science", "biology", "diseases", "vitamins", "health"] },
      { slug: "cell-genetics", name: "Cell Biology & Genetics", nameHi: "कोशिका विज्ञान व आनुवंशिकी", tags: ["science", "biology", "genetics", "dna"] },
      { slug: "plant-biology", name: "Plant Physiology & Botany", nameHi: "पादप कार्यिकी व वनस्पति विज्ञान", tags: ["science", "biology", "botany", "plants"] },
      { slug: "scientific-inventions", name: "Inventions, Discoveries & Scientists", nameHi: "वैज्ञानिक आविष्कार, खोजें व वैज्ञानिक", tags: ["science", "inventions", "discoveries"] }
    ]
  },
  {
    slug: "current-affairs",
    name: "Current Affairs & Daily Brief",
    nameHi: "समसामयिकी व दैनिक समाचार",
    description: "Daily national and international news, government schemes and updates",
    descriptionHi: "राष्ट्रीय एवं अंतरराष्ट्रीय दैनिक समाचार, योजनाएं व समसामयिक घटनाएं",
    icon: "newspaper",
    audience: ["students", "explorer"],
    sortOrder: 6,
    topics: [
      { slug: "national-affairs", name: "National Affairs & Governance", nameHi: "राष्ट्रीय घटनाक्रम व शासन", tags: ["current-affairs", "national"] },
      { slug: "international-events", name: "International Relations & Summits", nameHi: "अंतरराष्ट्रीय संबंध व शिखर सम्मेलन", tags: ["current-affairs", "international", "summits"] },
      { slug: "flagship-schemes", name: "New Government Schemes & Initiatives", nameHi: "नवीन सरकारी योजनाएं व पहल", tags: ["current-affairs", "schemes"] },
      { slug: "appointments-honors", name: "Appointments, Resignations & Dignitaries", nameHi: "महत्वपूर्ण नियुक्तियां व पद", tags: ["current-affairs", "appointments"] },
      { slug: "awards-prizes", name: "National & Global Awards", nameHi: "प्रमुख राष्ट्रीय व अंतरराष्ट्रीय पुरस्कार", tags: ["current-affairs", "awards", "prizes"] },
      { slug: "sports-current", name: "Recent Sports & Tournaments", nameHi: "हालिया खेल प्रतियोगिताएं व विजेता", tags: ["current-affairs", "sports"] },
      { slug: "science-tech-current", name: "Science, Defense & Space Updates", nameHi: "विज्ञान, रक्षा व अंतरिक्ष अपडेट्स", tags: ["current-affairs", "defense", "space", "isro"] },
      { slug: "economy-indexes", name: "Economic Reports, Indices & Rankings", nameHi: "आर्थिक सूचकांक, रैंकिंग व रिपोर्ट्स", tags: ["current-affairs", "indices", "reports"] },
      { slug: "important-days", name: "Important Days, Themes & Weeks", nameHi: "महत्वपूर्ण दिवस, सप्ताह व थीम", tags: ["current-affairs", "days", "themes"] },
      { slug: "obituaries-books", name: "Prominent Personalities & New Books", nameHi: "चर्चित व्यक्तित्व व नई पुस्तकें", tags: ["current-affairs", "books", "personalities"] }
    ]
  },
  {
    slug: "state-gk",
    name: "State GK & Heritage",
    nameHi: "राज्य सामान्य ज्ञान",
    description: "Comprehensive GK, history and culture of Indian states",
    descriptionHi: "भारतीय राज्यों का सामान्य ज्ञान, इतिहास, भूगोल एवं संस्कृति",
    icon: "map-pin",
    audience: ["students", "explorer"],
    sortOrder: 7,
    topics: [
      { slug: "rajasthan-gk", name: "Rajasthan GK & Culture", nameHi: "राजस्थान सामान्य ज्ञान व संस्कृति", tags: ["state-gk", "rajasthan"] },
      { slug: "uttar-pradesh-gk", name: "Uttar Pradesh GK & Heritage", nameHi: "उत्तर प्रदेश सामान्य ज्ञान व विरासत", tags: ["state-gk", "uttar-pradesh"] },
      { slug: "bihar-gk", name: "Bihar GK & History", nameHi: "बिहार सामान्य ज्ञान व इतिहास", tags: ["state-gk", "bihar"] },
      { slug: "madhya-pradesh-gk", name: "Madhya Pradesh GK", nameHi: "मध्य प्रदेश सामान्य ज्ञान", tags: ["state-gk", "madhya-pradesh"] },
      { slug: "haryana-punjab-gk", name: "Haryana & Punjab GK", nameHi: "हरियाणा व पंजाब सामान्य ज्ञान", tags: ["state-gk", "haryana", "punjab"] },
      { slug: "jharkhand-chhattisgarh-gk", name: "Jharkhand & Chhattisgarh GK", nameHi: "झारखंड व छत्तीसगढ़ सामान्य ज्ञान", tags: ["state-gk", "jharkhand", "chhattisgarh"] },
      { slug: "uttarakhand-himachal-gk", name: "Uttarakhand & Himachal Pradesh GK", nameHi: "उत्तराखंड व हिमाचल प्रदेश सामान्य ज्ञान", tags: ["state-gk", "uttarakhand", "himachal"] },
      { slug: "maharashtra-gujarat-gk", name: "Maharashtra & Gujarat GK", nameHi: "महाराष्ट्र व गुजरात सामान्य ज्ञान", tags: ["state-gk", "maharashtra", "gujarat"] },
      { slug: "south-indian-states", name: "South Indian States GK", nameHi: "दक्षिण भारतीय राज्यों का सामान्य ज्ञान", tags: ["state-gk", "south-india"] },
      { slug: "delhi-north-east", name: "Delhi, UTs & North-East India", nameHi: "दिल्ली, केंद्र शासित प्रदेश व पूर्वोत्तर भारत", tags: ["state-gk", "delhi", "north-east"] }
    ]
  },
  {
    slug: "art-culture",
    name: "Art, Culture & Literature",
    nameHi: "कला, संस्कृति व साहित्य",
    description: "Classical dances, music, festivals, heritage and literature",
    descriptionHi: "शास्त्रीय नृत्य, संगीत, मेले, त्योहार, धरोहर एवं प्रमुख साहित्य",
    icon: "palette",
    audience: ["students", "explorer"],
    sortOrder: 8,
    topics: [
      { slug: "classical-dances", name: "Classical & Folk Dances of India", nameHi: "भारत के शास्त्रीय व लोक नृत्य", tags: ["art-culture", "dance", "folk"] },
      { slug: "music-instruments", name: "Indian Classical Music & Instruments", nameHi: "भारतीय शास्त्रीय संगीत व वाद्ययंत्र", tags: ["art-culture", "music", "instruments"] },
      { slug: "fairs-festivals", name: "Fairs, Festivals & Celebrations", nameHi: "प्रमुख मेले, उत्सव व त्योहार", tags: ["art-culture", "fairs", "festivals"] },
      { slug: "paintings-handicrafts", name: "Traditional Paintings & Handicrafts", nameHi: "पारंपरिक चित्रकला व हस्तशिल्प", tags: ["art-culture", "paintings", "crafts"] },
      { slug: "unesco-heritage", name: "UNESCO World Heritage Sites in India", nameHi: "भारत के यूनेस्को विश्व धरोहर स्थल", tags: ["art-culture", "unesco", "heritage"] },
      { slug: "ancient-literature", name: "Ancient Epics, Vedas & Puranas", nameHi: "प्राचीन महाकाव्य, वेद व पुराण", tags: ["art-culture", "vedas", "epics"] },
      { slug: "modern-books-authors", name: "Famous Books & Eminent Authors", nameHi: "प्रसिद्ध पुस्तकें व लेखक", tags: ["art-culture", "books", "authors"] },
      { slug: "theatre-cinema", name: "Indian Cinema, Theatre & Dramatics", nameHi: "भारतीय सिनेमा व रंगमंच", tags: ["art-culture", "cinema", "theatre"] },
      { slug: "languages-dialects", name: "Indian Languages, Scripts & Dialects", nameHi: "भारतीय भाषाएं, लिपियां व बोलियां", tags: ["art-culture", "languages", "scripts"] },
      { slug: "religions-philosophy", name: "Indian Philosophy, Bhakti & Sufi Saints", nameHi: "भारतीय दर्शन, भक्ति व सूफी परंपरा", tags: ["art-culture", "philosophy", "saints"] }
    ]
  },
  {
    slug: "quantitative-aptitude",
    name: "Quantitative Aptitude & Math",
    nameHi: "गणित व अंकगणित",
    description: "Arithmetic, algebra, geometry, mensuration and data interpretation",
    descriptionHi: "अंकगणित, बीजगणित, ज्यामिति, क्षेत्रमिति एवं डेटा व्याख्या",
    icon: "calculator",
    audience: ["students", "explorer"],
    sortOrder: 9,
    topics: [
      { slug: "number-system", name: "Number System, HCF & LCM", nameHi: "संख्या पद्धति, म.स. व ल.स.", tags: ["math", "numbers", "hcf", "lcm"] },
      { slug: "simplification-fractions", name: "Simplification, Fractions & Decimals", nameHi: "सरलीकरण, भिन्न व दशमलव", tags: ["math", "simplification"] },
      { slug: "percentage", name: "Percentage & Base Calculations", nameHi: "प्रतिशत की अवधारणा व अनुप्रयोग", tags: ["math", "percentage"] },
      { slug: "profit-loss-discount", name: "Profit, Loss & Discount", nameHi: "लाभ, हानि व छूट", tags: ["math", "profit-loss", "discount"] },
      { slug: "simple-compound-interest", name: "Simple & Compound Interest", nameHi: "साधारण व चक्रवृद्धि ब्याज", tags: ["math", "interest", "si", "ci"] },
      { slug: "ratio-proportion", name: "Ratio, Proportion & Partnership", nameHi: "अनुपात, समानुपात व साझेदारी", tags: ["math", "ratio", "proportion"] },
      { slug: "time-work-pipes", name: "Time, Work, Pipes & Cisterns", nameHi: "समय, कार्य, नल व टंकी", tags: ["math", "work", "pipes"] },
      { slug: "time-speed-distance", name: "Time, Speed, Distance, Trains & Boats", nameHi: "समय, गति, रेलगाड़ी व नाव", tags: ["math", "speed", "distance", "trains"] },
      { slug: "mensuration-2d-3d", name: "Mensuration 2D & 3D", nameHi: "क्षेत्रमिति 2D व 3D", tags: ["math", "mensuration", "geometry"] },
      { slug: "data-interpretation", name: "Data Interpretation, Charts & Tables", nameHi: "डेटा व्याख्या व तालिकाएं", tags: ["math", "data-interpretation", "charts"] }
    ]
  },
  {
    slug: "reasoning",
    name: "Logical & Analytical Reasoning",
    nameHi: "तर्कशक्ति व मानसिक क्षमता",
    description: "Verbal, non-verbal, analytical puzzles and reasoning questions",
    descriptionHi: "भाषिक, अभाषिक, विश्लेषणात्मक पहेलियां एवं तार्किक प्रश्न",
    icon: "brain",
    audience: ["students", "explorer"],
    sortOrder: 10,
    topics: [
      { slug: "coding-decoding", name: "Coding & Decoding", nameHi: "कोडिंग और डिकोडिंग", tags: ["reasoning", "coding"] },
      { slug: "blood-relations", name: "Blood Relations", nameHi: "रक्त संबंध", tags: ["reasoning", "relations"] },
      { slug: "direction-sense", name: "Direction & Distance Sense", nameHi: "दिशा व दूरी परीक्षण", tags: ["reasoning", "direction"] },
      { slug: "syllogism-logic", name: "Syllogism & Deductive Logic", nameHi: "न्याय निगमन व तार्किक निष्कर्ष", tags: ["reasoning", "syllogism"] },
      { slug: "series-analogy", name: "Number & Alphabet Series, Analogy", nameHi: "श्रृंखला व सादृश्यता परीक्षण", tags: ["reasoning", "series", "analogy"] },
      { slug: "seating-arrangements", name: "Linear & Circular Seating Arrangements", nameHi: "बैठक व्यवस्था", tags: ["reasoning", "seating"] },
      { slug: "ranking-order", name: "Order, Ranking & Time Sequence", nameHi: "क्रम, श्रेणी व समय क्रम", tags: ["reasoning", "ranking", "order"] },
      { slug: "statement-assumptions", name: "Statement, Arguments & Assumptions", nameHi: "कथन, तर्क व पूर्वधारणाएं", tags: ["reasoning", "verbal", "arguments"] },
      { slug: "venn-diagrams", name: "Venn Diagrams & Mathematical Operations", nameHi: "वेन आरेख व गणितीय संक्रियाएं", tags: ["reasoning", "venn-diagram"] },
      { slug: "non-verbal-puzzles", name: "Non-Verbal Figures, Paper Folding & Mirror Images", nameHi: "चित्रात्मक पहेलियां व दर्पण प्रतिबिंब", tags: ["reasoning", "non-verbal", "mirror-image"] }
    ]
  },
  {
    slug: "english-language",
    name: "English Language & Comprehension",
    nameHi: "अंग्रेजी भाषा",
    description: "Grammar, vocabulary, sentence correction and reading comprehension",
    descriptionHi: "व्याकरण, शब्दावली, वाक्य शुद्धि एवं कॉम्प्रिहेंशन",
    icon: "book-open",
    audience: ["students", "explorer"],
    sortOrder: 11,
    topics: [
      { slug: "vocabulary-syn-ant", name: "Synonyms & Antonyms", nameHi: "समानार्थी व विलोम शब्द", tags: ["english", "vocabulary", "synonyms"] },
      { slug: "idioms-phrases", name: "Idioms, Phrases & Proverbs", nameHi: "मुहावरे व लोकोक्तियां", tags: ["english", "idioms", "phrases"] },
      { slug: "one-word-substitution", name: "One Word Substitution", nameHi: "एक शब्द प्रतिस्थापन", tags: ["english", "one-word"] },
      { slug: "spotting-errors", name: "Spotting Errors & Sentence Correction", nameHi: "वाक्य त्रुटियां व शुद्धि", tags: ["english", "grammar", "errors"] },
      { slug: "fill-in-the-blanks", name: "Fill in the Blanks & Prepositions", nameHi: "रिक्त स्थान पूर्ति", tags: ["english", "prepositions", "grammar"] },
      { slug: "active-passive-voice", name: "Active & Passive Voice", nameHi: "कर्तृवाच्य व कर्मवाच्य", tags: ["english", "voice"] },
      { slug: "direct-indirect-speech", name: "Direct & Indirect Speech / Narration", nameHi: "प्रत्यक्ष व अप्रत्यक्ष कथन", tags: ["english", "narration"] },
      { slug: "spelling-test", name: "Correct Spelling Test", nameHi: "शुद्ध वर्तनी परीक्षण", tags: ["english", "spelling"] },
      { slug: "reading-comprehension", name: "Reading Comprehension Passages", nameHi: "गद्यांश व बोध प्रश्न", tags: ["english", "comprehension"] },
      { slug: "cloze-test-para-jumbles", name: "Cloze Test & Sentence Rearrangement", nameHi: "क्लोज टेस्ट व वाक्य क्रम", tags: ["english", "cloze-test"] }
    ]
  },
  {
    slug: "hindi-grammar",
    name: "General Hindi & Vyakaran",
    nameHi: "सामान्य हिन्दी व व्याकरण",
    description: "Hindi grammar, sandhi, samas, idioms, vocabulary and literature",
    descriptionHi: "हिन्दी व्याकरण, संधि, समास, मुहावरे, पर्यायवाची व साहित्य",
    icon: "languages",
    audience: ["students", "explorer"],
    sortOrder: 12,
    topics: [
      { slug: "varn-sandhi", name: "वर्ण विचार, उच्चारण व संधि", nameHi: "वर्ण विचार, उच्चारण व संधि", tags: ["hindi", "sandhi", "varn"] },
      { slug: "shabd-bhed", name: "शब्द भेद: तत्सम, तद्भव, देशज व विदेशी", nameHi: "शब्द भेद: तत्सम, तद्भव, देशज व विदेशी", tags: ["hindi", "tatsam", "tadbhav"] },
      { slug: "sangya-sarvanam", name: "संज्ञा, सर्वनाम, विशेषण व क्रिया", nameHi: "संज्ञा, सर्वनाम, विशेषण व क्रिया", tags: ["hindi", "grammar", "noun"] },
      { slug: "samvaad-samas", name: "समास व समास विग्रह", nameHi: "समास व समास विग्रह", tags: ["hindi", "samas"] },
      { slug: "upsarg-pratyay", name: "उपसर्ग एवं प्रत्यय", nameHi: "उपसर्ग एवं प्रत्यय", tags: ["hindi", "affixes"] },
      { slug: "paryay-vilom", name: "पर्यायवाची एवं विलोम शब्द", nameHi: "पर्यायवाची एवं विलोम शब्द", tags: ["hindi", "paryayvachi", "vilom"] },
      { slug: "muhavare-lokokti", name: "मुहावरे एवं लोकोक्तियां", nameHi: "मुहावरे एवं लोकोक्तियां", tags: ["hindi", "muhavare", "lokoktiyan"] },
      { slug: "anek-shabd-ek", name: "अनेक शब्दों के लिए एक शब्द", nameHi: "अनेक शब्दों के लिए एक शब्द", tags: ["hindi", "one-word"] },
      { slug: "vakya-shuddhi", name: "वाक्य शुद्धि व वर्तनी शुद्धि", nameHi: "वाक्य शुद्धि व वर्तनी शुद्धि", tags: ["hindi", "shuddhi"] },
      { slug: "ras-chhand-alankar", name: "रस, छंद, अलंकार व हिन्दी साहित्य", nameHi: "रस, छंद, अलंकार व हिन्दी साहित्य", tags: ["hindi", "alankar", "literature"] }
    ]
  },
  {
    slug: "computer-knowledge",
    name: "Computer & Digital Technology",
    nameHi: "कंप्यूटर एवं सूचना प्रौद्योगिकी",
    description: "Computer hardware, software, MS Office, internet, networks and cyber security",
    descriptionHi: "कंप्यूटर हार्डवेयर, सॉफ्टवेयर, इंटरनेट, नेटवर्किंग एवं साइबर सुरक्षा",
    icon: "laptop",
    audience: ["students", "explorer"],
    sortOrder: 13,
    topics: [
      { slug: "computer-hardware-history", name: "History, Generations & Hardware", nameHi: "कंप्यूटर का इतिहास व हार्डवेयर", tags: ["computer", "hardware"] },
      { slug: "os-windows", name: "Operating Systems, Windows & Linux", nameHi: "ऑपरेटिंग सिस्टम", tags: ["computer", "os", "windows"] },
      { slug: "ms-office-tools", name: "MS Word, Excel & PowerPoint", nameHi: "एमएस ऑफिस टूल्स", tags: ["computer", "ms-office", "excel"] },
      { slug: "internet-networking", name: "Internet, Browsers, LAN & Networking", nameHi: "इंटरनेट व नेटवर्किंग", tags: ["computer", "internet", "network"] },
      { slug: "cyber-security-safety", name: "Cyber Security, Viruses, Firewalls & Threats", nameHi: "साइबर सुरक्षा व वायरस", tags: ["computer", "security", "cyber"] },
      { slug: "memory-storage", name: "Computer Memory, RAM, ROM & Storage", nameHi: "मेमोरी व स्टोरेज डिवाइसेस", tags: ["computer", "memory", "ram", "rom"] },
      { slug: "computer-abbreviations", name: "Common Computer Abbreviations & Acronyms", nameHi: "कंप्यूटर संक्षिप्त रूप", tags: ["computer", "abbreviations"] },
      { slug: "database-sql", name: "Database Basics, DBMS & SQL", nameHi: "डेटाबेस प्रबंधन प्रणाली", tags: ["computer", "dbms", "database"] },
      { slug: "programming-basics", name: "Basics of Programming & Web Tech", nameHi: "प्रोग्रामिंग व वेब तकनीक", tags: ["computer", "programming", "web"] },
      { slug: "ai-cloud-modern-tech", name: "AI, Cloud Computing & Emerging Tech", nameHi: "कृत्रिम बुद्धिमत्ता व आधुनिक तकनीक", tags: ["computer", "ai", "cloud"] }
    ]
  },
  {
    slug: "kids-trivia",
    name: "Kids Junior GK & Wonder World",
    nameHi: "बच्चों का ज्ञान व रोचक तथ्य",
    description: "Animals, birds, nature, space, wonders and fairy tales for young minds",
    descriptionHi: "पशु-पक्षी, प्रकृति, सौरमंडल, दुनिया के अजूबे एवं बाल कहानियां",
    icon: "sparkles",
    audience: ["kids"],
    sortOrder: 14,
    topics: [
      { slug: "animals-birds-kids", name: "Amazing Animals & Colorful Birds", nameHi: "रोचक जानवर और प्यारे पक्षी", tags: ["kids", "animals", "birds"] },
      { slug: "plants-nature-kids", name: "Trees, Flowers & Green Nature", nameHi: "पेड़-पौधे, फूल और प्रकृति", tags: ["kids", "nature", "plants"] },
      { slug: "solar-system-kids", name: "Stars, Moon & Our Solar System", nameHi: "तारे, चांद और हमारा सौरमंडल", tags: ["kids", "space", "planets"] },
      { slug: "our-body-senses", name: "Our Amazing Body & Five Senses", nameHi: "हमारा शरीर और पांच इंद्रियां", tags: ["kids", "human-body", "senses"] },
      { slug: "national-symbols-kids", name: "Indian National Symbols & Leaders", nameHi: "हमारे राष्ट्रीय प्रतीक और महापुरुष", tags: ["kids", "national-symbols"] },
      { slug: "fairy-tales-riddles", name: "Fun Riddles, Stories & Fairy Tales", nameHi: "मजेदार पहेलियां और बाल कहानियां", tags: ["kids", "riddles", "stories"] },
      { slug: "world-wonders-kids", name: "Wonders of the World & Tallest Things", nameHi: "दुनिया के सात अजूबे और अनोखी चीजें", tags: ["kids", "wonders"] },
      { slug: "everyday-science-kids", name: "Fun Science & Everyday Magic", nameHi: "दैनिक विज्ञान और मजेदार प्रयोग", tags: ["kids", "science-fun"] },
      { slug: "healthy-habits-kids", name: "Healthy Habits, Good Manners & Food", nameHi: "अच्छी आदतें, शिष्टाचार और आहार", tags: ["kids", "habits", "manners"] },
      { slug: "vehicles-transport-kids", name: "Trains, Planes & Cool Vehicles", nameHi: "गाड़ियां, रेलगाड़ी और हवाई जहाज", tags: ["kids", "vehicles", "transport"] }
    ]
  },
  {
    slug: "sports-trivia",
    name: "Sports, Games & World Records",
    nameHi: "खेलकूद व विश्व कीर्तिमान",
    description: "Cricket, Olympics, Football, Tennis, Chess and Sports Personalities",
    descriptionHi: "क्रिकेट, ओलंपिक, फुटबॉल, टेनिस, शतरंज, खिलाड़ी व रिकॉर्ड",
    icon: "trophy",
    audience: ["students", "explorer", "kids"],
    sortOrder: 15,
    topics: [
      { slug: "cricket-ipl", name: "Cricket History, World Cups & IPL", nameHi: "क्रिकेट इतिहास, विश्व कप व आईपीएल", tags: ["sports", "cricket", "ipl"] },
      { slug: "olympics-asian-games", name: "Olympic Games, Paralympics & Asian Games", nameHi: "ओलंपिक व एशियाई खेल", tags: ["sports", "olympics", "asian-games"] },
      { slug: "football-world-cup", name: "Football, FIFA World Cup & Top Clubs", nameHi: "फुटबॉल व फीफा विश्व कप", tags: ["sports", "football", "fifa"] },
      { slug: "traditional-indian-sports", name: "Kabaddi, Kho-Kho & Indigenous Sports", nameHi: "कबड्डी, खो-खो व देसी खेल", tags: ["sports", "kabaddi", "traditional"] },
      { slug: "tennis-grand-slams", name: "Tennis Grand Slams & Legends", nameHi: "टेनिस व ग्रैंड स्लैम टूर्नामेंट", tags: ["sports", "tennis", "grand-slam"] },
      { slug: "badminton-champions", name: "Badminton, Hockey & Team Sports", nameHi: "बैडमिंटन, हॉकी व प्रमुख राष्ट्रीय खेल", tags: ["sports", "badminton", "hockey"] },
      { slug: "athletics-records", name: "Athletics, Track & Field, Marathon", nameHi: "एथलेटिक्स व ट्रैक स्पर्धाएं", tags: ["sports", "athletics", "records"] },
      { slug: "chess-mind-sports", name: "Chess, Mind Games & Grandmasters", nameHi: "शतरंज व माइंड स्पोर्ट्स", tags: ["sports", "chess", "mind-games"] },
      { slug: "famous-sports-stars", name: "Legendary Sports Stars & Biographies", nameHi: "महान खिलाड़ी, आत्मकथाएं व सम्मान", tags: ["sports", "personalities", "stars"] },
      { slug: "sports-trophies-terms", name: "Trophies, Cups & Sports Terminologies", nameHi: "प्रमुख ट्रॉफियां, कप व खेल शब्दावली", tags: ["sports", "trophies", "terms"] }
    ]
  }
];

function determineCategoryMapping(catTopic, catSlug) {
  const t = (catTopic || "").toLowerCase();
  const s = (catSlug || "").toLowerCase();

  // State GK checks
  if (t.includes("rajasthan") || s.includes("rajasthan")) return { catSlug: "state-gk", topicSlug: "rajasthan-gk", state: "Rajasthan", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("uttar pradesh") || s.includes("uttar-pradesh") || t.includes("up gk")) return { catSlug: "state-gk", topicSlug: "uttar-pradesh-gk", state: "Uttar Pradesh", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("bihar") || s.includes("bihar")) return { catSlug: "state-gk", topicSlug: "bihar-gk", state: "Bihar", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("madhya pradesh") || s.includes("madhya-pradesh") || t.includes("mp gk")) return { catSlug: "state-gk", topicSlug: "madhya-pradesh-gk", state: "Madhya Pradesh", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("haryana") || s.includes("haryana")) return { catSlug: "state-gk", topicSlug: "haryana-punjab-gk", state: "Haryana", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("jharkhand") || s.includes("jharkhand")) return { catSlug: "state-gk", topicSlug: "jharkhand-chhattisgarh-gk", state: "Jharkhand", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("uttarakhand") || s.includes("uttarakhand")) return { catSlug: "state-gk", topicSlug: "uttarakhand-himachal-gk", state: "Uttarakhand", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("himachal") || s.includes("himachal")) return { catSlug: "state-gk", topicSlug: "uttarakhand-himachal-gk", state: "Himachal Pradesh", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("karnataka") || s.includes("karnataka")) return { catSlug: "state-gk", topicSlug: "south-indian-states", state: "Karnataka", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("kerala") || s.includes("kerala")) return { catSlug: "state-gk", topicSlug: "south-indian-states", state: "Kerala", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("gujarat") || s.includes("gujarat")) return { catSlug: "state-gk", topicSlug: "maharashtra-gujarat-gk", state: "Gujarat", audience: ["students", "explorer"], exam: ["State", "SSC"] };
  if (t.includes("goa") || s.includes("goa")) return { catSlug: "state-gk", topicSlug: "maharashtra-gujarat-gk", state: "Goa", audience: ["students", "explorer"], exam: ["State", "SSC"] };

  // History checks
  if (t.includes("gulam vansh") || t.includes("history") || t.includes("mughal") || t.includes("medieval") || t.includes("ancient") || t.includes("modern")) {
    if (t.includes("gulam vansh") || t.includes("medieval")) return { catSlug: "history", topicSlug: "medieval-india", state: null, audience: ["students", "explorer"], exam: ["SSC", "UPSC", "State"] };
    if (t.includes("ancient")) return { catSlug: "history", topicSlug: "ancient-india", state: null, audience: ["students", "explorer"], exam: ["SSC", "UPSC", "State"] };
    return { catSlug: "history", topicSlug: "modern-india", state: null, audience: ["students", "explorer"], exam: ["SSC", "UPSC", "State"] };
  }

  // Polity checks
  if (t.includes("polity") || t.includes("constitution") || t.includes("samvidhan")) {
    return { catSlug: "polity", topicSlug: "constitution-preamble", state: null, audience: ["students", "explorer"], exam: ["SSC", "UPSC", "State"] };
  }

  // Geography checks
  if (t.includes("geography") || t.includes("river") || t.includes("nadi") || t.includes("mountain") || t.includes("soil")) {
    return { catSlug: "geography", topicSlug: "physical-geography-india", state: null, audience: ["students", "explorer"], exam: ["SSC", "UPSC", "State"] };
  }

  // Science checks
  if (t.includes("science") || t.includes("physics") || t.includes("chemistry") || t.includes("biology") || t.includes("life science")) {
    return { catSlug: "general-science", topicSlug: "human-anatomy", state: null, audience: ["students", "explorer", "kids"], exam: ["SSC", "Railway"] };
  }

  // Math checks
  if (t.includes("math") || t.includes("arithmetic") || t.includes("algebra") || t.includes("mensuration") || t.includes("geometry")) {
    return { catSlug: "quantitative-aptitude", topicSlug: "number-system", state: null, audience: ["students", "explorer"], exam: ["SSC", "Banking", "Railway"] };
  }

  // Reasoning checks
  if (t.includes("reasoning") || t.includes("verbal") || t.includes("logical")) {
    return { catSlug: "reasoning", topicSlug: "coding-decoding", state: null, audience: ["students", "explorer"], exam: ["SSC", "Banking", "Railway"] };
  }

  // English checks
  if (t.includes("english") || t.includes("comprehension")) {
    return { catSlug: "english-language", topicSlug: "vocabulary-syn-ant", state: null, audience: ["students", "explorer"], exam: ["SSC", "Banking"] };
  }

  // Current Affairs checks
  if (t.includes("current affairs") || t.includes("daily current") || t.includes("schemes")) {
    return { catSlug: "current-affairs", topicSlug: "national-affairs", state: null, audience: ["students", "explorer"], exam: ["SSC", "Banking", "UPSC", "State"] };
  }

  // Kids / Animals / Birds / Logos / Objects / Image Quizzes
  if (t.includes("kid") || t.includes("animal") || t.includes("bird") || t.includes("object") || t.includes("vehicle") || t.includes("car")) {
    return { catSlug: "kids-trivia", topicSlug: "animals-birds-kids", state: null, audience: ["kids"], exam: [] };
  }

  // Art, Culture, Famous Places, Movies
  if (t.includes("art") || t.includes("culture") || t.includes("famous") || t.includes("place") || t.includes("movie") || t.includes("logo") || t.includes("personality")) {
    return { catSlug: "art-culture", topicSlug: "modern-books-authors", state: null, audience: ["explorer"], exam: [] };
  }

  // KBC / Trivia / General Default
  return { catSlug: "art-culture", topicSlug: "modern-books-authors", state: null, audience: ["explorer"], exam: ["SSC"] };
}

async function runMigration() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB for Step 4 Data Foundation Migration...");
    const db = client.db("quizweb");

    // 1. Create/Ensure Indexes on TaxonomyCategory & TaxonomyTopic & Question
    console.log("Creating indexes...");
    await db.collection("TaxonomyCategory").createIndex({ slug: 1 }, { unique: true });
    await db.collection("TaxonomyTopic").createIndex({ categoryId: 1, slug: 1 }, { unique: true });
    await db.collection("Question").createIndex({ category_id: 1 });
    await db.collection("Question").createIndex({ topic_id: 1 });
    await db.collection("Question").createIndex({ audience: 1 });
    await db.collection("Question").createIndex({ difficulty_level: 1 });
    await db.collection("Question").createIndex({ status: 1 });

    // 2. Upsert the 15 Standard Taxonomy Categories and 150 Topics
    console.log("Upserting 15 Categories & 150 Topics...");
    const categoryMap = new Map(); // slug -> category doc
    const topicMap = new Map(); // `${catSlug}:${topicSlug}` -> topic doc

    for (const catDef of TAXONOMY_DEFINITIONS) {
      const now = new Date();
      const catRes = await db.collection("TaxonomyCategory").findOneAndUpdate(
        { slug: catDef.slug },
        {
          $set: {
            slug: catDef.slug,
            name: catDef.name,
            nameHi: catDef.nameHi,
            description: catDef.description,
            descriptionHi: catDef.descriptionHi,
            icon: catDef.icon,
            audience: catDef.audience,
            sortOrder: catDef.sortOrder,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        { upsert: true, returnDocument: 'after' }
      );

      const catDoc = catRes;
      categoryMap.set(catDef.slug, catDoc);

      for (let i = 0; i < catDef.topics.length; i++) {
        const topDef = catDef.topics[i];
        const topRes = await db.collection("TaxonomyTopic").findOneAndUpdate(
          { categoryId: catDoc._id, slug: topDef.slug },
          {
            $set: {
              categoryId: catDoc._id,
              slug: topDef.slug,
              name: topDef.name,
              nameHi: topDef.nameHi,
              tags: topDef.tags,
              sortOrder: i + 1,
              updatedAt: now
            },
            $setOnInsert: {
              createdAt: now,
              questionCount: 0
            }
          },
          { upsert: true, returnDocument: 'after' }
        );
        topicMap.set(`${catDef.slug}:${topDef.slug}`, topRes);
      }
    }

    console.log(`Successfully ensured 15 Taxonomy Categories and ${topicMap.size} Taxonomy Topics in DB.`);

    // 3. Map Existing Categories to New Taxonomy
    console.log("Mapping existing categories to new taxonomy...");
    const existingCats = await db.collection("Category").find({}).toArray();
    console.log(`Found ${existingCats.length} existing categories.`);

    const existingCatToNewMap = new Map(); // existingCat._id string -> { catDoc, topDoc, state, audience, exam }

    for (const ec of existingCats) {
      const mapping = determineCategoryMapping(ec.topic, ec.slug);
      const targetCat = categoryMap.get(mapping.catSlug);
      const targetTop = topicMap.get(`${mapping.catSlug}:${mapping.topicSlug}`);
      
      existingCatToNewMap.set(ec._id.toString(), {
        targetCat,
        targetTop,
        state: mapping.state,
        audience: mapping.audience,
        exam: mapping.exam
      });

      // Update existing Category with pointer to new taxonomyCategoryId
      await db.collection("Category").updateOne(
        { _id: ec._id },
        { $set: { taxonomyCategoryId: targetCat._id, taxonomyCategorySlug: targetCat.slug } }
      );
    }

    // 4. Migrate All Questions into the New Schema
    const totalQuestions = await db.collection("Question").countDocuments();
    console.log(`Migrating ${totalQuestions} questions into Step 4 schema...`);

    const cursor = db.collection("Question").find({});
    let batch = [];
    let count = 0;
    const topicCountMap = new Map(); // topicId string -> count

    while (await cursor.hasNext()) {
      const q = await cursor.next();
      count++;

      // Parse options
      let parsedOptions = [];
      try {
        if (Array.isArray(q.options)) {
          parsedOptions = q.options;
        } else if (typeof q.options === 'string') {
          parsedOptions = JSON.parse(q.options);
        }
      } catch (e) {
        parsedOptions = [];
      }
      if (!Array.isArray(parsedOptions)) parsedOptions = [];
      
      // Ensure 4 options
      while (parsedOptions.length < 4) {
        parsedOptions.push(`Option ${parsedOptions.length + 1}`);
      }
      if (parsedOptions.length > 4) {
        parsedOptions = parsedOptions.slice(0, 4);
      }

      // Calculate correct_index
      let correctIdx = 0;
      if (typeof q.correctAnswer === 'string') {
        const exactIdx = parsedOptions.findIndex(o => String(o).trim() === String(q.correctAnswer).trim());
        if (exactIdx !== -1) {
          correctIdx = exactIdx;
        } else {
          // Check if correctAnswer is index string e.g. "0", "1", "2", "3"
          const num = parseInt(q.correctAnswer, 10);
          if (!isNaN(num) && num >= 0 && num < 4) {
            correctIdx = num;
          }
        }
      } else if (typeof q.correctAnswer === 'number') {
        correctIdx = Math.min(Math.max(0, q.correctAnswer), 3);
      }

      // Difficulty level: 1 Easy, 2 Medium, 3 Hard
      let diffLevel = 1;
      const diffStr = (q.difficulty || "").toLowerCase();
      if (diffStr === "medium" || diffStr === "2") diffLevel = 2;
      else if (diffStr === "hard" || diffStr === "3") diffLevel = 3;

      // Taxonomy mapping
      const mapping = existingCatToNewMap.get(q.categoryId ? q.categoryId.toString() : "") || {
        targetCat: categoryMap.get("art-culture"),
        targetTop: topicMap.get("art-culture:modern-books-authors"),
        state: null,
        audience: ["explorer"],
        exam: ["SSC"]
      };

      const catId = mapping.targetCat ? mapping.targetCat._id : null;
      const topId = mapping.targetTop ? mapping.targetTop._id : null;

      if (topId) {
        const topKey = topId.toString();
        topicCountMap.set(topKey, (topicCountMap.get(topKey) || 0) + 1);
      }

      // Text handling
      const textHi = q.textHi || q.text || "";
      const textEn = q.text || null;
      const explanationHi = q.explanationHi || q.explanation || null;
      const explanationEn = q.explanation || null;

      // Tags
      const tags = [...(mapping.targetTop ? mapping.targetTop.tags : [])];
      if (mapping.state) tags.push(mapping.state.toLowerCase());

      batch.push({
        updateOne: {
          filter: { _id: q._id },
          update: {
            $set: {
              text_hi: textHi,
              text_en: textEn,
              options_list: parsedOptions,
              correct_index: correctIdx,
              explanation_hi: explanationHi,
              explanation_en: explanationEn,
              category_id: catId,
              topic_id: topId,
              tags: tags,
              difficulty_level: diffLevel,
              audience: mapping.audience,
              exam: mapping.exam,
              state: mapping.state,
              class_level: null,
              type: "MCQ",
              image_url: q.image || null,
              time_sensitive: false,
              review_by: null,
              status: "published",
              source: "Standard Bank",
              attempts: typeof q.attempts === 'number' ? q.attempts : 0,
              correct: typeof q.correct === 'number' ? q.correct : 0,
              updatedAt: new Date()
            }
          }
        }
      });

      if (batch.length >= 500) {
        await db.collection("Question").bulkWrite(batch);
        console.log(`Migrated ${count} / ${totalQuestions} questions...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await db.collection("Question").bulkWrite(batch);
      console.log(`Migrated ${count} / ${totalQuestions} questions.`);
    }

    // 5. Update topic question counts
    console.log("Updating topic question counts...");
    for (const [topIdStr, qCount] of topicCountMap.entries()) {
      await db.collection("TaxonomyTopic").updateOne(
        { _id: new ObjectId(topIdStr) },
        { $set: { questionCount: qCount } }
      );
    }

    // 6. Verification
    const finalCount = await db.collection("Question").countDocuments();
    const sampleAfter = await db.collection("Question").findOne({});
    console.log("\n--- MIGRATION VERIFICATION ---");
    console.log("Total questions before:", totalQuestions);
    console.log("Total questions after:", finalCount);
    console.log("Sample migrated question:\n", JSON.stringify(sampleAfter, null, 2));

    const totalTopicsInDB = await db.collection("TaxonomyTopic").countDocuments();
    const totalCatsInDB = await db.collection("TaxonomyCategory").countDocuments();
    console.log(`Taxonomy in DB: ${totalCatsInDB} categories, ${totalTopicsInDB} topics.`);

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.close();
  }
}

runMigration();
