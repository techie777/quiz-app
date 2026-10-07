// src/lib/mainCategoriesConfig.js

/**
<<<<<<< HEAD
 * 40 Canonical Main Categories
 * Arranged according to:
 * 1. Top 15 Primary Featured Categories requested by user in exact sequence (1..15)
 * 2. Categories with active data / questions (16..25)
 * 3. Remaining categories (26..40)
=======
 * Canonical Main Categories for QuizWeb
 * Level 1 Taxonomy for QuizWeb.
 * Ordered precisely to customer specifications:
 * 1. India GK
 * 2. World GK
 * 3. Indian History
 * 4. Indian Geography
 * 5. Science GK
 * 6. Sports
 * 7. Technology
 * 8. Entertainment
 * 9. Indian States & UTs
 * 10. Indian Cities
 * 11. Human Body
 * 12. Food & Cuisine
 * 13. Amazing Facts
 * 14. Religion & Spirituality
 * 15. India Kingdoms
 * 16. Money & Business
 * 17. Animals & Nature
 * 18. Space
 * 19. Brain Riddles
 * Followed by all remaining categories.
>>>>>>> backup-today-pre-merge
 */

export const MAIN_CATEGORIES = [
  // 1. India GK
  {
    id: 1,
    slug: "india-gk",
    name: "India GK",
    nameHi: "भारत सामान्य ज्ञान",
    icon: "🇮🇳",
    example: "Indian History, Polity, Science",
    chip: "india-gk",
    description: "Explore the comprehensive trivia, heritage, politics, and achievements of India.",
    descriptionHi: "भारतीय इतिहास, राजनीति, संविधान, विज्ञान, संस्कृति और उपलब्धियों का विस्तृत क्विज़ संग्रह।",
    subcategories: [
      { name: "Indian History", slug: "indian-history", topics: ["Ancient India", "Medieval India", "Modern India", "Post-Independence"] },
      { name: "Indian Geography", slug: "indian-geography", topics: ["Rivers & Lakes", "Mountains & Hills", "Climate & Soil", "Natural Resources"] },
      { name: "Indian Polity", slug: "indian-polity", topics: ["Constitution", "Parliament", "Supreme Court", "Fundamental Rights"] },
      { name: "Indian Economy", slug: "indian-economy", topics: ["Banking & RBI", "Budget & Taxes", "Economic History", "Industry"] },
      { name: "Indian Culture", slug: "indian-culture", topics: ["Festivals", "Dances", "Folk Traditions", "Costumes"] },
      { name: "Indian Science", slug: "indian-science", topics: ["ISRO & Space", "Nuclear Research", "Scientists", "Inventions"] },
      { name: "Indian Sports", slug: "indian-sports", topics: ["Cricket History", "Olympics", "Hockey", "Indigenous Games"] },
      { name: "Indian Awards", slug: "indian-awards", topics: ["Bharat Ratna", "Padma Awards", "Gallantry Awards", "Sahitya Akademi"] },
      { name: "Indian Defence", slug: "indian-defence", topics: ["Indian Army", "Indian Navy", "Air Force", "Missiles & Tech"] },
      { name: "Indian Railways", slug: "indian-railways", topics: ["Railway History", "Zones & Trains", "Vande Bharat", "Tech"] },
    ],
  },

  // 2. World GK
  {
    id: 2,
    slug: "world-gk",
    name: "World GK",
    nameHi: "विश्व सामान्य ज्ञान",
    icon: "🌍",
    example: "Countries, Capitals, World History",
    chip: "all",
    description: "Global knowledge covering continents, nations, international organizations, and records.",
    descriptionHi: "विश्व के देश, राजधानियां, मुद्राएं, संयुक्त राष्ट्र, वैश्विक इतिहास और भूगोल।",
    subcategories: [
      { name: "World Geography", slug: "world-geography", topics: ["Continents", "Oceans & Seas", "Capitals & Currencies", "World Mountains"] },
      { name: "World History", slug: "world-history", topics: ["Ancient Civilizations", "World Wars", "Renaissance", "Great Empires"] },
      { name: "World Organizations", slug: "world-organizations", topics: ["United Nations", "WHO", "UNESCO", "World Bank & IMF"] },
      { name: "World Records", slug: "world-records", topics: ["Highest & Longest", "First in the World", "Guinness Records"] },
      { name: "Famous World Leaders", slug: "world-leaders", topics: ["Historical Figures", "Statesmen", "Nobel Laureates"] },
    ],
  },

  // 3. Indian History
  {
    id: 3,
<<<<<<< HEAD
    slug: "india-history",
    name: "India History",
    nameHi: "भारतीय इतिहास",
    icon: "📜",
    example: "Ancient, Medieval, Freedom Struggle",
    chip: "india-gk",
    description: "Ancient civilizations, medieval empires, Mughal era, and India's struggle for independence.",
    descriptionHi: "प्राचीन सभ्यताएं, मौर्य व गुप्त साम्राज्य, मध्यकालीन भारत और 1857 से 1947 का स्वतंत्रता संग्राम।",
=======
    slug: "indian-history",
    name: "Indian History",
    nameHi: "भारतीय इतिहास",
    icon: "🏛️",
    example: "Ancient, Medieval, Modern & Freedom Struggle",
    chip: "india-gk",
    description: "Chronicles of ancient civilizations, mighty dynasties, independence struggles, and visionary leaders.",
    descriptionHi: "प्राचीन भारत, सिंधु घाटी, मौर्य-गुप्त काल, स्वतंत्रता संग्राम और आधुनिक भारत का गौरवशाली इतिहास।",
    subcategories: [
      { name: "Ancient India", slug: "ancient-india", topics: ["Indus Valley Civilization", "Vedic Age", "Mauryan Empire", "Gupta Golden Age"] },
      { name: "Medieval India", slug: "medieval-india", topics: ["Delhi Sultanate", "Mughal Empire", "Maratha Empire", "Bhakti & Sufi Movement"] },
      { name: "Freedom Struggle", slug: "freedom-struggle", topics: ["1857 Revolt", "Gandhian Era", "Revolutionaries", "Partition & Independence"] },
      { name: "Post-Independence", slug: "post-independence", topics: ["Integration of States", "Wars & Treaties", "Revolutions & Progress"] },
    ],
  },

  // 4. Indian Geography
  {
    id: 4,
    slug: "indian-geography",
    name: "Indian Geography",
    nameHi: "भारतीय भूगोल",
    icon: "🗺️",
    example: "States, Rivers, Mountains, Climate",
    chip: "states",
    description: "Himalayas, peninsular rivers, monsoon patterns, soil types, and regional geography.",
    descriptionHi: "भारत की नदियां, पर्वतमालाएं, जलवायु, मिट्टी, राष्ट्रीय उद्यान और प्राकृतिक संपदा।",
>>>>>>> backup-today-pre-merge
    subcategories: [
      { name: "Ancient India", slug: "ancient-india", topics: ["Indus Valley Civilization", "Vedic Period", "Mauryan Empire", "Gupta Golden Age"] },
      { name: "Medieval India", slug: "medieval-india", topics: ["Delhi Sultanate", "Mughal Empire", "Maratha Empire", "Vijayanagara Empire"] },
      { name: "Modern India & Freedom Struggle", slug: "modern-india", topics: ["1857 Revolt", "Indian National Congress", "Mahatma Gandhi & Movements", "Revolutionary Heroes"] },
      { name: "Post-Independence India", slug: "post-independence", topics: ["Integration of States", "Five Year Plans", "Wars of 1965 & 1971", "Economic Reforms 1991"] },
    ],
  },
<<<<<<< HEAD
  {
    id: 4,
    slug: "india-geography",
    name: "India Geography",
    nameHi: "भारतीय भूगोल",
    icon: "🗺️",
    example: "Rivers, Mountains, Climate, Soil",
    chip: "states",
    description: "Himalayas, peninsular rivers, monsoon patterns, soil types, and regional geography of India.",
    descriptionHi: "भारत की नदियां, पर्वतमालाएं, मानसून, मिट्टी, वन्यजीव अभयारण्य और प्राकृतिक संपदा।",
    subcategories: [
      { name: "Rivers & Drainage", slug: "rivers-drainage", topics: ["Ganga & Yamuna Basin", "Indus System", "Brahmaputra", "Peninsular Rivers (Godavari, Krishna, Narmada)"] },
      { name: "Physical Features", slug: "physical-features", topics: ["The Himalayas", "Northern Plains", "Peninsular Plateau", "Coastal Plains & Islands"] },
      { name: "Climate & Agriculture", slug: "climate-agri", topics: ["Monsoon Seasons", "Major Crops", "Soil Classifications", "Irrigation Projects"] },
      { name: "National Parks & Wildlife", slug: "parks-reserves", topics: ["Tiger Reserves", "Bird Sanctuaries", "Biosphere Reserves", "Wetlands (Ramsar Sites)"] },
    ],
  },
  {
    id: 5,
    slug: "science",
    name: "Science",
    nameHi: "विज्ञान",
=======

  // 5. Science GK
  {
    id: 5,
    slug: "science",
    name: "Science GK",
    nameHi: "विज्ञान सामान्य ज्ञान",
>>>>>>> backup-today-pre-merge
    icon: "🔬",
    example: "Physics, Chemistry, Biology",
    chip: "science",
    description: "Fundamental laws of nature, chemical elements, human biology, genetics, and modern discovery.",
<<<<<<< HEAD
    descriptionHi: "भौतिक विज्ञान, रसायन विज्ञान, जीव विज्ञान और वैज्ञानिक खोजें।",
    subcategories: [
      { name: "Physics", slug: "physics", topics: ["Mechanics & Motion", "Optics & Light", "Electricity & Magnetism", "Thermodynamics", "Modern Physics"] },
      { name: "Chemistry", slug: "chemistry", topics: ["Periodic Table", "Chemical Reactions", "Acids & Bases", "Organic Compounds", "Everyday Chemistry"] },
      { name: "Biology & Life Sciences", slug: "biology", topics: ["Cell Biology", "Genetics & DNA", "Plant Physiology", "Ecology"] },
      { name: "Earth & Atmospheric Science", slug: "earth-science", topics: ["Geology", "Atmosphere & Weather", "Oceanography", "Fossils"] },
    ],
  },
  {
    id: 6,
    slug: "human-body",
    name: "Human Body",
    nameHi: "मानव शरीर व स्वास्थ्य",
    icon: "🫀",
    example: "Anatomy, Heart, Brain, Senses",
    chip: "science",
    description: "Human anatomy, vital organs, brain mechanisms, senses, nutrition, and medical facts.",
    descriptionHi: "मानव शरीर रचना, हृदय, मस्तिष्क, संवेदी अंग, पाचन तंत्र, पोषण और स्वास्थ्य विज्ञान।",
    subcategories: [
      { name: "Organ Systems", slug: "organ-systems", topics: ["Circulatory System & Heart", "Respiratory System & Lungs", "Digestive System", "Nervous System & Brain"] },
      { name: "Senses & Anatomy", slug: "senses-anatomy", topics: ["The Eyes & Vision", "The Ears & Sound", "Skeletal System & Bones", "Muscular System"] },
      { name: "Health, Nutrients & Diseases", slug: "health-nutrition", topics: ["Vitamins & Minerals", "Immunity & Antibodies", "Common Diseases", "First Aid"] },
    ],
  },
  {
    id: 7,
    slug: "animals-nature",
    name: "Animals & Nature",
    nameHi: "पशु-पक्षी और प्रकृति",
    icon: "🐾",
    example: "Wildlife, Birds, Marine Life, Forests",
    chip: "all",
    description: "Wildlife species, biodiversity, animal kingdoms, habitats, and environmental ecology.",
    descriptionHi: "वन्यजीव, पशु-पक्षी, समुद्री जीव, वर्षावन, जैव विविधता और प्राकृतिक आवास।",
    subcategories: [
      { name: "Mammals & Big Cats", slug: "mammals-cats", topics: ["Tigers & Lions", "Elephants", "Marine Mammals", "Primates & Apes"] },
      { name: "Birds & Flying Creatures", slug: "birds-avian", topics: ["Birds of Prey", "Migratory Birds", "Flightless Birds", "Exotic Species"] },
      { name: "Reptiles, Insects & Marine", slug: "marine-insects", topics: ["Reptiles & Amphibians", "Ocean Creatures & Sharks", "Insects & Bees", "Corals & Deep Sea"] },
      { name: "Ecology & Conservation", slug: "ecology-conservation", topics: ["Endangered Species", "Rainforests", "Food Chains", "Global Conservation"] },
    ],
  },
  {
    id: 8,
    slug: "space-universe",
    name: "Space & Universe",
    nameHi: "अंतरिक्ष व ब्रह्मांड",
    icon: "🚀",
    example: "Solar System, Galaxies, ISRO, NASA",
    chip: "space",
    description: "Planets of the solar system, galaxies, black holes, ISRO missions, NASA, and celestial cosmology.",
    descriptionHi: "सौरमंडल, ग्रह, तारे, ब्लैक होल, इसरो मिशन, चंद्रयान, नासा और ब्रह्मांडीय रहस्य।",
    subcategories: [
      { name: "Solar System & Planets", slug: "solar-system", topics: ["The Sun", "Inner Planets", "Gas Giants", "Moons of the Solar System"] },
      { name: "Deep Space & Universe", slug: "deep-space", topics: ["Galaxies & Nebulae", "Black Holes", "Stars & Supernovas", "Big Bang"] },
      { name: "Space Agencies & Missions", slug: "space-missions", topics: ["ISRO (Chandrayaan, Mangalyaan)", "NASA (Apollo, Artemis)", "SpaceX", "James Webb Telescope"] },
    ],
  },
  {
    id: 9,
    slug: "technology",
    name: "Technology",
    nameHi: "कंप्यूटर व तकनीक",
    icon: "💻",
    example: "Computers, AI, Internet, Gadgets",
    chip: "science",
    description: "Artificial intelligence, software, coding, smartphones, cybersecurity, and future tech.",
    descriptionHi: "कंप्यूटर, कृत्रिम बुद्धिमत्ता (AI), इंटरनेट, सॉफ्टवेयर, प्रोग्रामिंग और गैजेट्स।",
    subcategories: [
      { name: "Computers & Software", slug: "computers", topics: ["Operating Systems", "Programming Languages", "Hardware Basics", "Cloud Computing"] },
      { name: "AI & Modern Tech", slug: "ai-modern", topics: ["Artificial Intelligence", "Robotics", "Machine Learning", "Smartphones & Apps"] },
      { name: "Cybersecurity & Internet", slug: "cyber-internet", topics: ["Cyber Safety", "Networking Protocols", "Social Media", "Digital Payments"] },
    ],
  },
  {
    id: 10,
    slug: "sports",
    name: "Sports",
    nameHi: "खेलकूद",
    icon: "⚽",
    example: "Cricket, Football, Olympics, Tennis",
    chip: "sports",
    description: "Cricket, IPL, football world cups, Olympics, badminton, hockey, chess, and athletic legends.",
    descriptionHi: "क्रिकेट, आईपीएल, फुटबॉल, ओलंपिक, बैडमिंटन, शतरंज और खेल इतिहास।",
    subcategories: [
      { name: "Cricket & IPL", slug: "cricket", topics: ["World Cups", "IPL Records", "Indian Cricket Legends", "Test Cricket", "T20 Trivia"] },
      { name: "Football & Leagues", slug: "football", topics: ["FIFA World Cup", "UEFA Champions League", "Messi & Ronaldo", "ISL"] },
      { name: "Olympics & Athletics", slug: "olympics", topics: ["Olympic History", "Indian Medalists", "Track & Field", "Paralympics"] },
      { name: "Racket & Board Sports", slug: "other-sports", topics: ["Badminton", "Tennis Grand Slams", "Chess Grandmasters", "Hockey"] },
    ],
  },
  {
    id: 11,
    slug: "brain-riddles",
    name: "Brain Riddles",
    nameHi: "दिमागी पहेलियां व तार्किक सोच",
    icon: "🧩",
    example: "Riddles, Logic, Math Puzzles, IQ",
    chip: "fun",
    description: "Logic puzzles, mental math, tricky riddles, pattern recognition, and IQ teasers.",
    descriptionHi: "मजेदार पहेलियां, तार्किक सोच, गणितीय ट्रिक्स, ऑप्टिकल इल्यूजन और आईक्यू क्विज़।",
    subcategories: [
      { name: "Classic & Tricky Riddles", slug: "classic-riddles", topics: ["Word Play Riddles", "Who Am I?", "Mystery Scenarios", "Hindi Paheliyan"] },
      { name: "Logical Reasoning", slug: "logical-reasoning", topics: ["Number Series", "Direction Sense", "Blood Relations", "Analogy"] },
      { name: "Math & Pattern Teasers", slug: "math-teasers", topics: ["Mental Math", "Shape & Pattern Puzzles", "Clock & Calendar Riddles"] },
    ],
  },
  {
    id: 12,
    slug: "amazing-facts",
    name: "Amazing Facts",
    nameHi: "अनोखे व रोचक तथ्य",
    icon: "✨",
    example: "World Records, Oddities, Marvels",
    chip: "fun",
    description: "Mind-blowing trivia, curious anomalies, incredible world records, and fun truths.",
    descriptionHi: "दुनिया के सबसे अजीबोगरीब नियम, प्राकृतिक अजूबे, ऐतिहासिक रहस्य और अनोखे तथ्य।",
    subcategories: [
      { name: "Nature & Animal Oddities", slug: "nature-oddities", topics: ["Weird Animal Behaviors", "Unusual Natural Phenomena", "Extreme Weather Facts"] },
      { name: "Incredible Human Feats", slug: "human-feats", topics: ["Guinness World Records", "Bizarre Inventions", "Historical Curiosities"] },
      { name: "Everyday Curiosities", slug: "everyday-curiosities", topics: ["How Things Began", "Food Origins", "Common Misconceptions"] },
    ],
  },
  {
    id: 13,
    slug: "entertainment",
    name: "Entertainment",
    nameHi: "मनोरंजन व सिनेमा",
    icon: "🎬",
    example: "Bollywood, Movies, OTT, TV",
    chip: "cinema",
    description: "Bollywood, regional Indian cinema, Hollywood, famous dialogues, actors, and TV series.",
    descriptionHi: "बॉलीवुड, दक्षिण भारतीय सिनेमा, हॉलीवुड, प्रसिद्ध डायलॉग्स, गाने और अभिनेता।",
    subcategories: [
      { name: "Bollywood Cinema", slug: "bollywood", topics: ["Classic Movies", "Iconic Dialogues", "Superstars", "Music Directors"] },
      { name: "Regional Indian Cinema", slug: "regional-cinema", topics: ["South Cinema (Tollywood, Kollywood)", "Bengali Cinema", "Marathi Cinema"] },
      { name: "Hollywood & Global Film", slug: "hollywood", topics: ["Oscar Winners", "Blockbusters", "Franchises (Marvel, DC)", "Directors"] },
      { name: "TV Shows & Web Series", slug: "shows-series", topics: ["Indian Television", "OTT Web Series", "Reality Shows", "Sitcoms"] },
    ],
  },
  {
    id: 14,
    slug: "food",
    name: "Food",
    nameHi: "खान-पान व व्यंजन",
    icon: "🍕",
    example: "Indian Street Food, Cuisines, Sweets",
    chip: "all",
    description: "Regional cuisines, street food, culinary traditions, spices, and international recipes.",
    descriptionHi: "भारतीय व्यंजन, स्ट्रीट फूड, मिठाइयां, मसाले, चाय-कॉफी और विश्व प्रसिद्ध भोजन।",
    subcategories: [
      { name: "Indian Regional Cuisines", slug: "indian-regional", topics: ["North Indian (Mughlai, Punjabi)", "South Indian (Dosa, Idli)", "Bengali Sweets", "Gujarati & Rajasthani Thali"] },
      { name: "Street Food & Snacks", slug: "street-food", topics: ["Chaat & Golgappe", "Samosa & Pakora", "Vada Pav & Pav Bhaji", "Famous Local Delicacies"] },
      { name: "Spices & Culinary Secrets", slug: "spices-traditions", topics: ["Indian Spices (Masale)", "Tea & Coffee Culture", "Festive Foods", "Cooking Techniques"] },
      { name: "World Cuisines", slug: "world-cuisines", topics: ["Italian (Pizza, Pasta)", "Asian (Sushi, Noodles)", "Mexican & Mediterranean", "Baking & Desserts"] },
    ],
  },
  {
    id: 15,
    slug: "money-business",
    name: "Money & Business",
    nameHi: "व्यापार, वित्त व अर्थव्यवस्था",
    icon: "💰",
    example: "Banking, Stocks, Startups, Economy",
    chip: "all",
    description: "Banking concepts, monetary policy, stock markets, startups, taxation, and corporate history.",
    descriptionHi: "बैंकिंग, शेयर बाजार, बजट, मुद्रास्फीति, जीएसटी, स्टार्टअप्स और प्रसिद्ध कंपनियां।",
    subcategories: [
      { name: "Banking & Finance", slug: "banking-finance", topics: ["RBI & Monetary Policy", "Types of Accounts", "Inflation & Repo Rate", "Financial Terms"] },
      { name: "Stock Market & Investments", slug: "stock-market", topics: ["NSE & BSE", "Mutual Funds", "IPO Basics", "Global Indices"] },
      { name: "Companies & Unicorns", slug: "companies-startups", topics: ["Indian Startups", "Tech Giants", "Famous CEOs", "Mergers & Acquisitions"] },
    ],
  },

  // --------------------------------------------------------------------------
  // Categories with Active Questions (Positions 16..25)
  // --------------------------------------------------------------------------
  {
    id: 16,
    slug: "art-culture",
    name: "Art & Culture",
    nameHi: "कला, संस्कृति व साहित्य",
    icon: "🎨",
    example: "Paintings, Monuments, Architecture",
    chip: "india-gk",
    description: "Indian art history, classical dances, music gharanas, architectural heritage, and literature.",
    descriptionHi: "भारतीय कला, वास्तुकला, शास्त्रीय नृत्य, साहित्य और सांस्कृतिक धरोहर।",
    subcategories: [
      { name: "Classical & Folk Dances", slug: "dances", topics: ["Bharatanatyam", "Kathak", "Kathakali", "Folk Dances (Bhangra, Garba)"] },
      { name: "Indian Paintings & Crafts", slug: "paintings", topics: ["Madhubani", "Warli", "Mughal Miniature", "Tanjore Art"] },
      { name: "Architecture & Monuments", slug: "monuments", topics: ["Temple Architecture", "Mughal Architecture", "Colonial Heritage"] },
    ],
  },
  {
    id: 17,
    slug: "indian-states-uts",
    name: "Indian States & UTs",
    nameHi: "भारतीय राज्य व केंद्र शासित प्रदेश",
    icon: "🏛️",
    example: "Rajasthan, MP, Kerala",
    chip: "states",
    description: "Dedicated quizzes for each of India's 28 states and 8 union territories.",
    descriptionHi: "राजस्थान, मध्य प्रदेश, उत्तर प्रदेश, केरल सहित सभी 28 राज्यों और 8 केंद्र शासित प्रदेशों का विशेष ज्ञान।",
=======
    descriptionHi: "भौतिक विज्ञान, रसायन विज्ञान, जीव विज्ञान, मानव शरीर और वैज्ञानिक नियम।",
>>>>>>> backup-today-pre-merge
    subcategories: [
      { name: "Physics", slug: "physics", topics: ["Mechanics & Motion", "Optics & Light", "Electricity & Magnetism", "Thermodynamics", "Modern Physics"] },
      { name: "Chemistry", slug: "chemistry", topics: ["Periodic Table", "Chemical Reactions", "Acids & Bases", "Organic Compounds", "Everyday Chemistry"] },
      { name: "Biology & Life Sciences", slug: "biology", topics: ["Human Anatomy", "Cell Biology", "Genetics & DNA", "Plant Physiology", "Ecology"] },
      { name: "Earth & Atmospheric Science", slug: "earth-science", topics: ["Geology", "Atmosphere & Weather", "Oceanography", "Fossils"] },
    ],
  },

  // 6. Sports
  {
<<<<<<< HEAD
    id: 18,
    slug: "general-knowledge",
    name: "General Knowledge",
    nameHi: "सामान्य ज्ञान (Mixed GK)",
    icon: "🧠",
    example: "Mixed GK, Rapid Fire",
    chip: "all",
    description: "All-round trivia, miscellaneous facts, general curiosity questions, and quick quizzes.",
    descriptionHi: "सर्वश्रेष्ठ मिश्रित सामान्य ज्ञान, महत्वपूर्ण तिथियां, संक्षिप्त नाम और रोचक तथ्य।",
    subcategories: [
      { name: "Static GK Highlights", slug: "static-gk", topics: ["First in World", "Largest & Smallest", "Important Days", "Headquarters"] },
      { name: "Curiosity & Trivia", slug: "curiosity-trivia", topics: ["Everyday Science Facts", "Human Wonders", "Odd & Unusual Facts"] },
    ],
  },
  {
    id: 19,
    slug: "religion-spirituality",
    name: "Religion & Spirituality",
=======
    id: 6,
    slug: "sports",
    name: "Sports",
    nameHi: "खेलकूद",
    icon: "🏏",
    example: "Cricket, Football, Olympics",
    chip: "sports",
    description: "Cricket, IPL, football world cups, Olympics, badminton, hockey, chess, and athletic legends.",
    descriptionHi: "क्रिकेट, आईपीएल, फुटबॉल, ओलंपिक, बैडमिंटन, शतरंज और खेल इतिहास।",
    subcategories: [
      { name: "Cricket & IPL", slug: "cricket", topics: ["World Cups", "IPL Records", "Indian Cricket Legends", "Test Cricket", "T20 Trivia"] },
      { name: "Football & Leagues", slug: "football", topics: ["FIFA World Cup", "UEFA Champions League", "Messi & Ronaldo", "ISL"] },
      { name: "Olympics & Athletics", slug: "olympics", topics: ["Olympic History", "Indian Medalists", "Track & Field", "Paralympics"] },
      { name: "Racket & Board Sports", slug: "other-sports", topics: ["Badminton", "Tennis Grand Slams", "Chess Grandmasters", "Hockey"] },
    ],
  },

  // 7. Technology
  {
    id: 7,
    slug: "technology",
    name: "Technology",
    nameHi: "कंप्यूटर व तकनीक",
    icon: "💻",
    example: "Computers, AI, Internet",
    chip: "science",
    description: "Artificial intelligence, software, coding, smartphones, cybersecurity, and future tech.",
    descriptionHi: "कंप्यूटर, कृत्रिम बुद्धिमत्ता (AI), इंटरनेट, सॉफ्टवेयर, प्रोग्रामिंग और गैजेट्स।",
    subcategories: [
      { name: "Computers & Software", slug: "computers", topics: ["Operating Systems", "Programming Languages", "Hardware Basics", "Cloud Computing"] },
      { name: "AI & Modern Tech", slug: "ai-modern", topics: ["Artificial Intelligence", "Robotics", "Machine Learning", "Smartphones & Apps"] },
      { name: "Cybersecurity & Internet", slug: "cyber-internet", topics: ["Cyber Safety", "Networking Protocols", "Social Media", "Digital Payments"] },
    ],
  },

  // 8. Entertainment
  {
    id: 8,
    slug: "entertainment",
    name: "Entertainment",
    nameHi: "मनोरंजन व सिनेमा",
    icon: "🎬",
    example: "Bollywood, Movies, TV",
    chip: "cinema",
    description: "Bollywood, regional Indian cinema, Hollywood, famous dialogues, actors, and TV series.",
    descriptionHi: "बॉलीवुड, दक्षिण भारतीय सिनेमा, हॉलीवुड, प्रसिद्ध डायलॉग्स, गाने और अभिनेता।",
    subcategories: [
      { name: "Bollywood Cinema", slug: "bollywood", topics: ["Classic Movies", "Iconic Dialogues", "Superstars", "Music Directors"] },
      { name: "Regional Indian Cinema", slug: "regional-cinema", topics: ["South Cinema (Tollywood, Kollywood)", "Bengali Cinema", "Marathi Cinema"] },
      { name: "Hollywood & Global Film", slug: "hollywood", topics: ["Oscar Winners", "Blockbusters", "Franchises (Marvel, DC)", "Directors"] },
      { name: "TV Shows & Web Series", slug: "shows-series", topics: ["Indian Television", "OTT Web Series", "Reality Shows", "Sitcoms"] },
    ],
  },

  // 9. Indian States & UTs
  {
    id: 9,
    slug: "indian-states-uts",
    name: "Indian States & UTs",
    nameHi: "भारतीय राज्य व केंद्र शासित प्रदेश",
    icon: "🏛️",
    example: "Rajasthan, MP, UP, Kerala",
    chip: "states",
    description: "Dedicated quizzes for each of India's 28 states and 8 union territories.",
    descriptionHi: "राजस्थान, मध्य प्रदेश, उत्तर प्रदेश, केरल सहित सभी 28 राज्यों और 8 केंद्र शासित प्रदेशों का विशेष ज्ञान।",
    subcategories: [
      { name: "Northern States", slug: "north-india", topics: ["Uttar Pradesh", "Rajasthan", "Punjab", "Haryana", "Himachal Pradesh", "Uttarakhand"] },
      { name: "Central & Western States", slug: "central-west-india", topics: ["Madhya Pradesh", "Maharashtra", "Gujarat", "Chhattisgarh", "Goa"] },
      { name: "Southern States", slug: "south-india", topics: ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana"] },
      { name: "Eastern & North-Eastern States", slug: "east-northeast-india", topics: ["Bihar", "West Bengal", "Odisha", "Assam", "Sikkim", "Seven Sisters"] },
      { name: "Union Territories", slug: "union-territories", topics: ["Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Andaman & Nicobar", "Chandigarh"] },
    ],
  },

  // 10. Indian Cities
  {
    id: 10,
    slug: "indian-cities",
    name: "Indian Cities",
    nameHi: "भारत के प्रमुख शहर",
    icon: "🏙️",
    example: "Mumbai, Delhi, Indore, Jaipur",
    chip: "cities",
    description: "Famous urban hubs, metropolitan culture, food, landmarks, and city histories.",
    descriptionHi: "इंदौर, मुंबई, दिल्ली, जयपुर, बेंगलुरु सहित भारत के प्रमुख शहरों का इतिहास, संस्कृति और पहचान।",
    subcategories: [
      { name: "Mega Metros", slug: "metros", topics: ["Delhi NCR", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad"] },
      { name: "Heritage & Cultural Cities", slug: "heritage-cities", topics: ["Varanasi", "Jaipur", "Udaipur", "Amritsar", "Madurai"] },
      { name: "Clean & Smart Cities", slug: "smart-cities", topics: ["Indore", "Surat", "Bhopal", "Chandigarh", "Pune"] },
    ],
  },

  // 11. Human Body
  {
    id: 11,
    slug: "human-body",
    name: "Human Body",
    nameHi: "मानव शरीर",
    icon: "🫀",
    example: "Organs, Anatomy, Health & Biology",
    chip: "science",
    description: "Fascinating anatomy, organs, brain functions, circulatory system, nutrients, and medical wonders.",
    descriptionHi: "मानव शरीर की संरचना, हृदय, मस्तिष्क, पाचन तंत्र, रक्त समूह, विटामिन्स और स्वास्थ्य ज्ञान।",
    subcategories: [
      { name: "Vital Organs & Systems", slug: "vital-organs", topics: ["Heart & Circulation", "Brain & Nervous System", "Lungs & Respiration", "Digestive System"] },
      { name: "Skeletal & Muscular", slug: "skeleton-muscles", topics: ["Bones & Joints", "Muscles", "Skin & Hair", "Sensory Organs"] },
      { name: "Health & Nutrition", slug: "health-nutrition", topics: ["Vitamins & Minerals", "Immunity & Diseases", "Blood Groups", "First Aid"] },
    ],
  },

  // 12. Food & Cuisine
  {
    id: 12,
    slug: "food-cuisine",
    name: "Food",
    nameHi: "खानपान व व्यंजन",
    icon: "🍛",
    example: "Indian Food, World Food",
    chip: "all",
    description: "Traditional regional delicacies, street food classics, spices, and international culinary arts.",
    descriptionHi: "भारतीय प्रांतीय व्यंजन, मिठाइयां, मसाले, स्ट्रीट फूड और वैश्विक खानपान।",
    subcategories: [
      { name: "Indian Regional Cuisines", slug: "indian-cuisine", topics: ["North Indian Curries", "South Indian Tiffins", "Bengali Sweets", "Gujarati & Rajasthani Thali"] },
      { name: "Spices & Food Science", slug: "spices-science", topics: ["Indian Spices", "Nutritional Value", "Herbs", "Cooking Techniques"] },
      { name: "World Food & Beverages", slug: "world-food", topics: ["Italian & Mediterranean", "Asian Cuisines", "Coffee & Tea Cultures", "Desserts"] },
    ],
  },

  // 13. Amazing Facts
  {
    id: 13,
    slug: "amazing-facts",
    name: "Amazing Facts",
    nameHi: "रोचक व आश्चर्यजनक तथ्य",
    icon: "✨",
    example: "Mind-blowing Facts, World Curiosities",
    chip: "fun",
    description: "Astonishing records, mind-boggling trivia, quirky natural phenomena, and fun facts.",
    descriptionHi: "दुनिया के सबसे अनोखे रहस्य, चौंकाने वाले वैज्ञानिक तथ्य, अजब-गजब रिकॉर्ड्स और पहेलियां।",
    subcategories: [
      { name: "Nature & Animal Wonders", slug: "nature-wonders", topics: ["Bizarre Animals", "Natural Marvels", "Deep Sea Secrets"] },
      { name: "Human & Science Oddities", slug: "science-oddities", topics: ["Brain Quirks", "Space Mysteries", "Everyday Inventions"] },
      { name: "World Records & Curiosities", slug: "world-curiosities", topics: ["Guinness Records", "Ancient Mysteries", "Quirky Cultures"] },
    ],
  },

  // 14. Religion & Spirituality
  {
    id: 14,
    slug: "religion-spirituality",
    name: "Religious & Spirituality",
>>>>>>> backup-today-pre-merge
    nameHi: "धर्म और आध्यात्म",
    icon: "🙏",
    example: "Hinduism, Buddhism, Jainism",
    chip: "all",
    description: "Sacred scriptures, epics, deities, philosophical schools, festivals, and world religions.",
    descriptionHi: "रामायण, महाभारत, वेद, उपनिषद, बौद्ध, जैन, सिख व विश्व धर्मों का पावन ज्ञान।",
    subcategories: [
      { name: "Hinduism & Epics", slug: "hinduism", topics: ["Ramayana", "Mahabharata", "Vedas & Upanishads", "Bhagavad Gita", "Puranas"] },
      { name: "Buddhism & Jainism", slug: "buddhism-jainism", topics: ["Lord Buddha & Teachings", "Tirthankaras", "Mahavira", "Sacred Sites"] },
      { name: "Sikhism & Gurus", slug: "sikhism", topics: ["Ten Sikh Gurus", "Guru Granth Sahib", "Golden Temple", "Festivals"] },
      { name: "World Religions", slug: "world-religions", topics: ["Islam", "Christianity", "Judaism", "Zoroastrianism"] },
    ],
  },
<<<<<<< HEAD
  {
    id: 20,
    slug: "history",
    name: "History",
    nameHi: "विश्व इतिहास",
    icon: "🏛️",
    example: "Ancient, Medieval, Modern World",
    chip: "all",
    description: "Ancient empires, revolutions, world wars, freedom struggles, and historic milestones.",
    descriptionHi: "प्राचीन सभ्यताएं, मध्यकालीन सल्तनतें, आधुनिक क्रांतियां और विश्व इतिहास।",
=======

  // 15. India Kingdoms
  {
    id: 15,
    slug: "indian-kingdoms",
    name: "India Kingdom",
    nameHi: "भारतीय राजवंश व साम्राज्य",
    icon: "👑",
    example: "Maurya, Gupta, Chola, Maratha, Rajput",
    chip: "india-gk",
    description: "Great dynasties of Bharat: Mauryas, Guptas, Cholas, Marathas, Mughals, Rajputs, and Vijayanagara.",
    descriptionHi: "मौर्य, गुप्त, चोल, मराठा, चालुक्य, राजपूत और विजयनगर साम्राज्य की वीरता और शौर्य गाथाएं।",
    subcategories: [
      { name: "Ancient Empires", slug: "ancient-empires", topics: ["Mauryan Empire & Ashoka", "Gupta Dynasty", "Harshavardhana", "Satavahanas"] },
      { name: "Southern Kingdoms", slug: "southern-kingdoms", topics: ["Chola Empire", "Pallavas & Pandyas", "Vijayanagara Empire", "Chalukyas & Rashtrakutas"] },
      { name: "Medieval Powers & Valor", slug: "medieval-powers", topics: ["Maratha Empire & Shivaji", "Rajput Dynasties", "Ahom Kingdom", "Sikh Empire"] },
    ],
  },

  // 16. Money & Business
  {
    id: 16,
    slug: "business-economy",
    name: "Money & Business",
    nameHi: "व्यापार व अर्थव्यवस्था (Money & Business)",
    icon: "💰",
    example: "Banking, Finance, Startups, Stocks",
    chip: "all",
    description: "Banking concepts, monetary policy, stock markets, startups, taxation, and corporate history.",
    descriptionHi: "बैंकिंग, शेयर बाजार, बजट, मुद्रास्फीति, जीएसटी, स्टार्टअप्स और प्रसिद्ध कंपनियां।",
    subcategories: [
      { name: "Banking & Finance", slug: "banking-finance", topics: ["RBI & Monetary Policy", "Types of Accounts", "Inflation & Repo Rate", "Financial Terms"] },
      { name: "Stock Market & Investments", slug: "stock-market", topics: ["NSE & BSE", "Mutual Funds", "IPO Basics", "Global Indices"] },
      { name: "Companies & Unicorns", slug: "companies-startups", topics: ["Indian Startups", "Tech Giants", "Famous CEOs", "Mergers & Acquisitions"] },
    ],
  },

  // 17. Animals & Nature
  {
    id: 17,
    slug: "animals-nature",
    name: "Animals & Nature",
    nameHi: "पशु व प्रकृति",
    icon: "🐾",
    example: "Wildlife, Animals, Forests & Birds",
    chip: "science",
    description: "Mammals, birds, marine life, animal behaviors, biodiversity hotspots, and national parks.",
    descriptionHi: "वन्यजीव, पशु-पक्षी, जलीय जीवन, राष्ट्रीय उद्यान, दुर्लभ प्रजातियां और प्रकृति संरक्षण।",
    subcategories: [
      { name: "Wildlife & Habitats", slug: "wildlife-habitats", topics: ["Big Cats of India", "Bird Species", "Marine Life", "Endangered Animals"] },
      { name: "Animal Intelligence & Behaviors", slug: "animal-behaviors", topics: ["Migration Patterns", "Camouflage & Defense", "Animal Records"] },
      { name: "Forests & Sanctuaries", slug: "sanctuaries", topics: ["National Parks", "Tiger Reserves", "Biosphere Reserves"] },
    ],
  },

  // 18. Space
  {
    id: 18,
    slug: "space-astronomy",
    name: "Space",
    nameHi: "अंतरिक्ष व खगोल विज्ञान",
    icon: "🚀",
    example: "ISRO, NASA, Planets, Stars",
    chip: "space",
    description: "Planets of the solar system, galaxies, black holes, ISRO missions, NASA, and moon landings.",
    descriptionHi: "सौरमंडल, ग्रह, तारे, ब्लैक होल, इसरो मिशन, चंद्रयान, नासा और ब्रह्मांडीय रहस्य।",
    subcategories: [
      { name: "Solar System & Planets", slug: "solar-system", topics: ["The Sun", "Inner Planets", "Gas Giants", "Moons of the Solar System"] },
      { name: "Deep Space & Universe", slug: "deep-space", topics: ["Galaxies & Nebulae", "Black Holes", "Stars & Supernovas", "Big Bang"] },
      { name: "Space Agencies & Missions", slug: "space-missions", topics: ["ISRO (Chandrayaan, Mangalyaan)", "NASA (Apollo, Artemis)", "SpaceX", "James Webb Telescope"] },
    ],
  },

  // 19. Brain Riddles
  {
    id: 19,
    slug: "reasoning-brain-games",
    name: "Brain Riddles",
    nameHi: "तर्कशक्ति व पहेलियां (Brain Riddles)",
    icon: "🧩",
    example: "Logic, Puzzles, Riddles, IQ",
    chip: "fun",
    description: "Logical deduction, verbal reasoning, pattern recognition, spatial puzzles, and brain workouts.",
    descriptionHi: "तार्किक तर्कशक्ति, कोडिंग-डिकोडिंग, दिशा ज्ञान, ब्लड रिलेशन और पहेलियां।",
>>>>>>> backup-today-pre-merge
    subcategories: [
      { name: "Logical Deduction", slug: "logical-reasoning", topics: ["Syllogisms", "Blood Relations", "Direction Sense", "Seating Arrangements"] },
      { name: "Verbal & Pattern Reasoning", slug: "pattern-reasoning", topics: ["Series Completion", "Coding-Decoding", "Analogy", "Odd One Out"] },
      { name: "Brain Teasers & Riddles", slug: "riddles-puzzles", topics: ["Math Puzzles", "Lateral Thinking", "Classic Riddles", "IQ Teasers"] },
    ],
  },

  // ── REMAINING CATEGORIES ──
  {
<<<<<<< HEAD
    id: 21,
    slug: "famous-people",
    name: "Famous People",
    nameHi: "प्रसिद्ध हस्तियां",
    icon: "🌟",
    example: "Leaders, Scientists, Pioneers",
=======
    id: 20,
    slug: "general-knowledge",
    name: "General Knowledge",
    nameHi: "सामान्य ज्ञान (Mixed GK)",
    icon: "🧠",
    example: "Mixed GK, Curiosity",
    chip: "all",
    description: "All-round trivia, miscellaneous facts, general curiosity questions, and quick quizzes.",
    descriptionHi: "सर्वश्रेष्ठ मिश्रित सामान्य ज्ञान, महत्वपूर्ण तिथियां, संक्षिप्त नाम और रोचक तथ्य।",
    subcategories: [
      { name: "Static GK Highlights", slug: "static-gk", topics: ["First in World", "Largest & Smallest", "Important Days", "Headquarters"] },
      { name: "Curiosity & Trivia", slug: "curiosity-trivia", topics: ["Everyday Science Facts", "Human Wonders", "Odd & Unusual Facts"] },
    ],
  },
  {
    id: 21,
    slug: "current-affairs",
    name: "Current Affairs",
    nameHi: "करेंट अफेयर्स",
    icon: "📰",
    example: "India, World, Sports",
    chip: "all",
    description: "Latest national and international developments, summits, sports triumphs, and honors.",
    descriptionHi: "दैनिक समसामयिकी, राष्ट्रीय व अंतर्राष्ट्रीय घटनाक्रम, शिखर सम्मेलन और खेल जगत की ताज़ा खबरें।",
    subcategories: [
      { name: "National News", slug: "national-affairs", topics: ["Government Policies", "Appointments", "State Schemes", "Summits"] },
      { name: "International Affairs", slug: "international-affairs", topics: ["Global Treaties", "G20 & BRICS", "Bilateral Visits", "Global Conflicts"] },
      { name: "Sports & Awards Current", slug: "sports-awards-ca", topics: ["Recent Tournaments", "Current Honors", "Championship Winners"] },
    ],
  },
  {
    id: 22,
    slug: "history",
    name: "World History",
    nameHi: "विश्व इतिहास",
    icon: "📜",
    example: "Civilizations, World Wars",
    chip: "all",
    description: "Ancient empires, revolutions, world wars, freedom struggles, and historic milestones.",
    descriptionHi: "प्राचीन सभ्यताएं, मध्यकालीन सल्तनतें, आधुनिक क्रांतियां और विश्व इतिहास।",
    subcategories: [
      { name: "Ancient Civilizations", slug: "ancient-civ", topics: ["Indus Valley", "Mesopotamia", "Ancient Egypt", "Ancient Greece & Rome"] },
      { name: "Medieval Empires", slug: "medieval-empires", topics: ["Ottoman Empire", "Mongol Empire", "Byzantine Empire", "Holy Roman Empire"] },
      { name: "Modern World & Revolutions", slug: "modern-world", topics: ["French Revolution", "Industrial Revolution", "World War I & II", "Cold War"] },
    ],
  },
  {
    id: 23,
    slug: "geography",
    name: "World Geography",
    nameHi: "विश्व भूगोल",
    icon: "🌎",
    example: "Continents, Oceans, Deserts",
    chip: "all",
    description: "Physical geography, world mountains, deserts, straits, tectonic plates, and maps.",
    descriptionHi: "महाद्वीप, महासागर, जलसंधियां, मरुस्थल, ज्वालामुखी और स्थलाकृतियां।",
    subcategories: [
      { name: "Physical Geography", slug: "physical-geography", topics: ["Plate Tectonics", "Volcanoes & Earthquakes", "Glaciers & Deserts", "Atmosphere"] },
      { name: "World Water Bodies", slug: "water-bodies", topics: ["Major Rivers of World", "Great Lakes", "Straits & Canals", "Ocean Trenches"] },
      { name: "World Maps & Latitudes", slug: "cartography", topics: ["Equator & Tropics", "Time Zones", "Prime Meridian", "Map Projections"] },
    ],
  },
  {
    id: 24,
    slug: "politics-government",
    name: "Politics & Government",
    nameHi: "राजनीति व शासन",
    icon: "⚖️",
    example: "Constitution, Parliament, Elections",
    chip: "all",
    description: "Constitutional articles, parliament sessions, democratic institutions, and prime ministers.",
    descriptionHi: "भारतीय संविधान, संसद, राष्ट्रपति, चुनाव आयोग, मौलिक अधिकार और प्रशासनिक व्यवस्था।",
    subcategories: [
      { name: "Constitution & Law", slug: "constitution", topics: ["Preamble & Articles", "Fundamental Rights", "Constitutional Amendments", "Judiciary"] },
      { name: "Parliament & Executive", slug: "parliament-executive", topics: ["Lok Sabha & Rajya Sabha", "President & Prime Minister", "Cabinet Ministries"] },
      { name: "Elections & Governance", slug: "elections-governance", topics: ["Election Commission", "EVM & Voting", "State Legislatures", "Panchayati Raj"] },
    ],
  },
  {
    id: 25,
    slug: "environment-nature",
    name: "Environment & Ecology",
    nameHi: "पर्यावरण व पारिस्थितिकी",
    icon: "🌿",
    example: "Climate, Ecology, Conservation",
    chip: "science",
    description: "Biodiversity conservation, climate action, ecosystems, global warming, and green living.",
    descriptionHi: "पर्यावरण संरक्षण, पारिस्थितिकी तंत्र, जलवायु परिवर्तन, प्रदूषण नियंत्रण और जैव विविधता।",
    subcategories: [
      { name: "Ecology & Ecosystems", slug: "ecology", topics: ["Food Chains", "Biomes", "Biodiversity Hotspots", "Ozone Layer"] },
      { name: "Climate Change & Action", slug: "climate-change", topics: ["Global Warming", "Paris Agreement", "Renewable Energy", "Carbon Footprint"] },
      { name: "Conservation & Sanctuaries", slug: "conservation", topics: ["Endangered Species", "Project Tiger", "Ramsar Sites", "Forest Acts"] },
    ],
  },
  {
    id: 26,
    slug: "music",
    name: "Music",
    nameHi: "संगीत व वाद्य",
    icon: "🎵",
    example: "Bollywood, Classical, Instruments",
    chip: "cinema",
    description: "Indian classical ragas, legendary singers, folk rhythms, and world musical instruments.",
    descriptionHi: "भारतीय शास्त्रीय संगीत, राग, वादक, पार्श्वगायक और अंतर्राष्ट्रीय संगीत।",
    subcategories: [
      { name: "Indian Classical Music", slug: "classical-music", topics: ["Hindustani Music", "Carnatic Music", "Ragas & Taals", "Gharanas"] },
      { name: "Playback Singers & Composers", slug: "playback-singers", topics: ["Lata Mangeshkar", "Kishore Kumar", "A.R. Rahman", "RD Burman"] },
      { name: "Musical Instruments", slug: "instruments", topics: ["String (Sitar, Sarod)", "Percussion (Tabla, Mridangam)", "Wind (Flute, Shehnai)"] },
    ],
  },
  {
    id: 27,
    slug: "literature",
    name: "Literature",
    nameHi: "साहित्य व पुस्तकें",
    icon: "📚",
    example: "Books, Authors, Poetry",
>>>>>>> backup-today-pre-merge
    chip: "all",
    description: "World leaders, visionary scientists, freedom fighters, and influential personalities.",
    descriptionHi: "वैज्ञानिक, राजनेता, विचारक, क्रांतिकारी और दुनिया बदलने वाले महान व्यक्तित्व।",
    subcategories: [
      { name: "Great Scientists", slug: "scientists", topics: ["Albert Einstein", "Newton", "APJ Abdul Kalam", "Marie Curie"] },
      { name: "World Leaders", slug: "world-leaders", topics: ["Abraham Lincoln", "Nelson Mandela", "Winston Churchill", "Martin Luther King"] },
    ],
  },
  {
<<<<<<< HEAD
    id: 22,
    slug: "indian-cities",
    name: "Indian Cities",
    nameHi: "भारत के प्रमुख शहर",
    icon: "🏙️",
    example: "Mumbai, Delhi, Indore, Jaipur",
    chip: "cities",
    description: "Famous urban hubs, metropolitan culture, food, landmarks, and city histories.",
    descriptionHi: "इंदौर, मुंबई, दिल्ली, जयपुर, बेंगलुरु सहित भारत के प्रमुख शहरों का इतिहास, संस्कृति और पहचान।",
=======
    id: 28,
    slug: "language-grammar",
    name: "Language & Grammar",
    nameHi: "भाषा व व्याकरण",
    icon: "🔤",
    example: "English, Hindi, Vocabulary",
    chip: "all",
    description: "Vocabulary booster, Hindi vyakaran, English grammar rules, idioms, and language roots.",
    descriptionHi: "हिंदी व्याकरण (संधि, समास), अंग्रेजी ग्रामर, शब्दावली, मुहावरे और विश्व भाषाएं।",
>>>>>>> backup-today-pre-merge
    subcategories: [
      { name: "Clean & Smart Cities", slug: "smart-cities", topics: ["Indore", "Surat", "Bhopal", "Chandigarh", "Pune"] },
      { name: "Mega Metros", slug: "metros", topics: ["Delhi NCR", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad"] },
      { name: "Heritage & Cultural Cities", slug: "heritage-cities", topics: ["Varanasi", "Jaipur", "Udaipur", "Amritsar", "Madurai"] },
    ],
  },
  {
<<<<<<< HEAD
    id: 23,
    slug: "politics-government",
    name: "Politics & Government",
    nameHi: "राजनीति व शासन",
    icon: "⚖️",
    example: "Parliament, Elections, Laws",
    chip: "india-gk",
    description: "Indian political system, constitutional bodies, elections, and governance.",
    descriptionHi: "संसद, चुनाव प्रणाली, प्रमुख आयोग, संविधान संशोधन और शासन व्यवस्था।",
=======
    id: 29,
    slug: "mathematics",
    name: "Mathematics",
    nameHi: "गणित",
    icon: "➗",
    example: "Arithmetic, Algebra, Geometry",
    chip: "all",
    description: "Mental arithmetic, speed math, algebra formulas, geometry theorems, and problem solving.",
    descriptionHi: "अंकगणित, बीजगणित, रेखागणित, संख्या पद्धति और रोचक गणितीय पहेलियां।",
>>>>>>> backup-today-pre-merge
    subcategories: [
      { name: "Elections & Parliament", slug: "elections-parliament", topics: ["Lok Sabha", "Rajya Sabha", "Election Commission", "Voting Rights"] },
      { name: "Governance & Policies", slug: "governance", topics: ["NITI Aayog", "Public Welfare Schemes", "Judiciary & High Courts"] },
    ],
  },
  {
<<<<<<< HEAD
    id: 24,
    slug: "brands-companies",
    name: "Brands & Companies",
    nameHi: "ब्रांड्स और कंपनियां",
    icon: "🏷️",
    example: "Tata, Apple, Google, Reliance",
    chip: "all",
    description: "Famous multinational brands, Indian business houses, logos, slogans, and corporate history.",
    descriptionHi: "टाटा, रिलायंस, एप्पल, गूगल सहित प्रसिद्ध कंपनियों के संस्थापक, लोगो और व्यापारिक तथ्य।",
    subcategories: [
      { name: "Indian Conglomerates", slug: "indian-brands", topics: ["Tata Group", "Reliance Industries", "Mahindra", "Adani Group"] },
      { name: "Global Tech Giants", slug: "global-brands", topics: ["Apple & Microsoft", "Google & Alphabet", "Amazon", "Tesla"] },
    ],
  },
  {
    id: 25,
    slug: "lifestyle-everyday-knowledge",
    name: "Lifestyle & Everyday Knowledge",
    nameHi: "दैनिक जीवन व व्यावहारिक ज्ञान",
    icon: "☕",
    example: "Health, Etiquette, Daily Hacks",
    chip: "all",
    description: "Daily life facts, civic sense, wellness tips, social etiquette, and common sense trivia.",
    descriptionHi: "रोजमर्रा का व्यावहारिक ज्ञान, शिष्टाचार, स्वास्थ्य आदतें और सामान्य जागरूकता।",
    subcategories: [
      { name: "Everyday Habits", slug: "daily-habits", topics: ["Sleep & Hydration", "Home Safety", "Traffic Rules", "Digital Well-being"] },
    ],
  },

  // --------------------------------------------------------------------------
  // Remaining Categories (Positions 26..40)
  // --------------------------------------------------------------------------
  {
    id: 26,
    slug: "music",
    name: "Music",
    nameHi: "संगीत व वाद्य",
    icon: "🎵",
    example: "Classical, Bollywood, Global",
    chip: "cinema",
    description: "Indian classical ragas, legendary singers, folk rhythms, and world musical instruments.",
    descriptionHi: "भारतीय शास्त्रीय संगीत, राग, वादक, पार्श्वगायक और अंतर्राष्ट्रीय संगीत।",
    subcategories: [
      { name: "Classical Music", slug: "classical-music", topics: ["Hindustani Music", "Carnatic Music", "Ragas & Taals"] },
      { name: "Playback Singers", slug: "playback-singers", topics: ["Lata Mangeshkar", "Kishore Kumar", "A.R. Rahman"] },
    ],
  },
  {
    id: 27,
    slug: "current-affairs",
    name: "Current Affairs",
    nameHi: "करेंट अफेयर्स",
    icon: "📰",
    example: "National, International, Summits",
    chip: "all",
    description: "Latest national and international developments, summits, sports triumphs, and honors.",
    descriptionHi: "दैनिक समसामयिकी, राष्ट्रीय व अंतर्राष्ट्रीय घटनाक्रम, शिखर सम्मेलन और ताज़ा खबरें।",
    subcategories: [
      { name: "National Affairs", slug: "national-affairs", topics: ["Government Schemes", "Summits", "Appointments"] },
    ],
  },
  {
    id: 28,
    slug: "literature",
    name: "Literature",
    nameHi: "साहित्य व पुस्तकें",
    icon: "📚",
    example: "Novels, Authors, Classics",
    chip: "all",
    description: "Great writers, Nobel prize laureates, epics, famous novels, and poetic traditions.",
    descriptionHi: "महान लेखक, उपन्यासकार, ज्ञानपीठ पुरस्कार विजेता और कालजयी कृतियां।",
    subcategories: [
      { name: "Indian Literature", slug: "indian-literature", topics: ["Premchand", "Rabindranath Tagore", "Kalidasa", "Jnanpith Winners"] },
    ],
  },
  {
    id: 29,
    slug: "language-grammar",
    name: "Language & Grammar",
    nameHi: "भाषा और व्याकरण",
    icon: "🔤",
    example: "Hindi, English, Idioms",
    chip: "all",
    description: "Vocabulary, idioms, proverbs, grammar fundamentals, and linguistic origins.",
    descriptionHi: "हिंदी व्याकरण, मुहावरे, लोकोक्तियां, अंग्रेजी वोकैबुलरी और भाषा विज्ञान।",
    subcategories: [
      { name: "Hindi Vyakaran", slug: "hindi-grammar", topics: ["Muhavare", "Sandhi & Samas", "Vilom Shabd", "Paryayvachi"] },
    ],
  },
  {
    id: 30,
    slug: "mathematics",
    name: "Mathematics",
    nameHi: "गणित",
    icon: "🔢",
    example: "Arithmetic, Algebra, Geometry",
    chip: "science",
    description: "Numbers, geometry, famous theorems, Vedic math tricks, and mathematical prodigies.",
    descriptionHi: "अंकगणित, ज्यामिति, वैदिक गणित, पहेलियां और रामानुजन का गणितीय योगदान।",
    subcategories: [
      { name: "Arithmetic & Numbers", slug: "arithmetic", topics: ["Number Theory", "Fractions & Percentages", "Vedic Math Tricks"] },
=======
    id: 30,
    slug: "art-culture",
    name: "Art & Culture",
    nameHi: "कला व संस्कृति",
    icon: "🎨",
    example: "Paintings, Folk Art, Dances",
    chip: "all",
    description: "Classical and folk dances, Indian painting schools, handicrafts, UNESCO intangible heritage.",
    descriptionHi: "भारतीय शास्त्रीय नृत्य (कथक, भरतनाट्यम), लोक कलाएं (मधुबनी, वारली) और शिल्प।",
    subcategories: [
      { name: "Classical & Folk Dances", slug: "dances", topics: ["8 Classical Dances", "Folk Dances (Bhangra, Garba, Bihu)", "Tribal Dances"] },
      { name: "Paintings & Handicrafts", slug: "paintings", topics: ["Madhubani", "Warli Art", "Mughal Miniature", "Pattachitra", "Textiles"] },
      { name: "Cultural Heritage", slug: "cultural-heritage", topics: ["UNESCO Intangible List", "Fairs & Melas (Kumbh Mela)", "Festivals of India"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 31,
    slug: "heritage-monuments",
    name: "Heritage & Monuments",
    nameHi: "धरोहर व स्मारक",
    icon: "🏰",
<<<<<<< HEAD
    example: "UNESCO Sites, Forts, Palaces",
    chip: "india-gk",
    description: "UNESCO World Heritage sites in India and the world, ancient forts, and grand palaces.",
    descriptionHi: "यूनेस्को विश्व धरोहर स्थल, ऐतिहासिक किले, मकबरे और भारतीय स्थापत्य कला।",
    subcategories: [
      { name: "Indian Forts & Palaces", slug: "forts-palaces", topics: ["Red Fort", "Amer Fort", "Gwalior Fort", "Mysore Palace"] },
=======
    example: "Taj Mahal, Red Fort, Temples",
    chip: "india-gk",
    description: "Ancient temples, forts of Rajasthan, Mughal architecture, caves, and world heritage sites.",
    descriptionHi: "ताजमहल, लाल किला, कोणार्क, एलोरा की गुफाएं, राजस्थान के दुर्ग और ऐतिहासिक धरोहरें।",
    subcategories: [
      { name: "Forts & Palaces", slug: "forts-palaces", topics: ["Rajasthan Hill Forts", "Red Fort", "Gwalior Fort", "Mysore Palace"] },
      { name: "Ancient Temples & Caves", slug: "temples-caves", topics: ["Ajanta & Ellora", "Khajuraho", "Konark Sun Temple", "Chola Temples", "Hampi"] },
      { name: "Mughal & Colonial Architecture", slug: "mughal-colonial", topics: ["Taj Mahal", "Qutub Minar", "Fatehpur Sikri", "Gateway of India", "Victoria Memorial"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 32,
<<<<<<< HEAD
    slug: "transport",
    name: "Transport",
    nameHi: "परिवहन प्रणाली",
    icon: "🚆",
    example: "Railways, Aviation, Highways",
    chip: "all",
    description: "Indian Railways, national highways, aviation networks, shipping ports, and metro systems.",
    descriptionHi: "भारतीय रेलवे, राष्ट्रीय राजमार्ग, हवाई अड्डे, समुद्री बंदरगाह और मेट्रो ट्रेनें।",
    subcategories: [
      { name: "Indian Railways", slug: "railways-transport", topics: ["Bullet Train", "Vande Bharat", "Longest Routes", "Hill Railways"] },
=======
    slug: "famous-people",
    name: "Famous Personalities",
    nameHi: "प्रसिद्ध हस्तियां",
    icon: "👥",
    example: "Leaders, Scientists, Pioneers",
    chip: "all",
    description: "Biographies and achievements of statesmen, visionary scientists, social reformers, and icons.",
    descriptionHi: "महात्मा गांधी, डॉ. एपीजे अब्दुल कलाम, भगत सिंह, स्वामी विवेकानंद और विश्व विभूतियां।",
    subcategories: [
      { name: "Indian Visionaries & Reformers", slug: "indian-visionaries", topics: ["Swami Vivekananda", "B.R. Ambedkar", "Raja Ram Mohan Roy", "Sardar Patel"] },
      { name: "Scientists & Innovators", slug: "scientists", topics: ["A.P.J. Abdul Kalam", "C.V. Raman", "Homi Bhabha", "Srinivasa Ramanujan"] },
      { name: "Global Icons", slug: "global-icons", topics: ["Albert Einstein", "Nelson Mandela", "Martin Luther King Jr.", "Marie Curie"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 33,
<<<<<<< HEAD
    slug: "defence-military",
    name: "Defence & Military",
    nameHi: "रक्षा व सैन्य बल",
    icon: "🛡️",
    example: "Army, Navy, Air Force, Weapons",
    chip: "india-gk",
    description: "Armed forces history, aircraft carriers, missile defense systems, and bravery honors.",
    descriptionHi: "भारतीय थलसेना, नौसेना, वायुसेना, मिसाइल सिस्टम (अग्नि, ब्रह्मोस) और परमवीर चक्र।",
    subcategories: [
      { name: "Armed Forces", slug: "armed-forces", topics: ["Army Operations", "Navy Fleets", "Fighter Jets (Rafale, Tejas)", "Paramilitary"] },
=======
    slug: "transport",
    name: "Transport & Railways",
    nameHi: "परिवहन व रेलवे",
    icon: "🚆",
    example: "Railways, Highways, Aviation",
    chip: "all",
    description: "Indian Railways network, national highways, expressways, ports, aviation, and shipping.",
    descriptionHi: "भारतीय रेलवे, वंदे भारत, राष्ट्रीय राजमार्ग, एक्सप्रेसवे, हवाई अड्डे और प्रमुख बंदरगाह।",
    subcategories: [
      { name: "Indian Railways", slug: "railways", topics: ["Zones & Divisions", "Vande Bharat & Bullet Train", "Heritage Railways", "Longest Routes"] },
      { name: "Roadways & Highways", slug: "roadways", topics: ["National Highways (NH)", "Expressways", "Golden Quadrilateral", "Bridges & Tunnels"] },
      { name: "Aviation & Maritime", slug: "aviation-maritime", topics: ["Major Airports", "Air India History", "Major Sea Ports", "Inland Waterways"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 34,
<<<<<<< HEAD
    slug: "awards-achievements",
    name: "Awards & Achievements",
    nameHi: "पुरस्कार व सम्मान",
    icon: "🏆",
    example: "Bharat Ratna, Nobel, Oscars",
    chip: "all",
    description: "Civilian honors, Nobel prizes, Olympic medals, Booker prize, and cinema awards.",
    descriptionHi: "भारत रत्न, पद्म पुरस्कार, नोबेल पुरस्कार, ऑस्कर और राष्ट्रीय खेल पुरस्कार।",
    subcategories: [
      { name: "Civilian & Gallantry", slug: "civilian-awards", topics: ["Bharat Ratna Recipients", "Padma Vibhushan", "Param Vir Chakra"] },
=======
    slug: "defence-military",
    name: "Defence & Military",
    nameHi: "रक्षा व सैन्य बल",
    icon: "🛡️",
    example: "Army, Navy, Air Force, Missiles",
    chip: "india-gk",
    description: "Indian Army, Navy, Air Force, missile technology, gallantry awards, and joint exercises.",
    descriptionHi: "भारतीय थलसेना, नौसेना, वायुसेना, मिसाइल प्रणालियां (ब्रह्मोस, अग्नि) और शौर्य गाथाएं।",
    subcategories: [
      { name: "Armed Forces Wings", slug: "armed-forces", topics: ["Indian Army", "Indian Navy & Aircraft Carriers", "Indian Air Force & Fighters"] },
      { name: "Missiles & Defence Tech", slug: "defence-tech", topics: ["BrahMos & Agni", "DRDO Innovations", "Air Defence Systems", "Submarines"] },
      { name: "Wars, Operations & Honours", slug: "wars-operations", topics: ["1971 War", "Kargil Conflict", "Param Vir Chakra Recipients", "Joint Exercises"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 35,
<<<<<<< HEAD
    slug: "gaming",
    name: "Gaming",
    nameHi: "गेमिंग व ई-स्पोर्ट्स",
    icon: "🎮",
    example: "Video Games, Esports, Consoles",
    chip: "sports",
    description: "Video game history, esports tournaments, iconic characters, consoles, and retro games.",
    descriptionHi: "वीडियो गेम इतिहास, ई-स्पोर्ट्स, प्लेस्टेशन, निंटेंडो और प्रसिद्ध गेम कैरेक्टर्स।",
    subcategories: [
      { name: "Esports & Consoles", slug: "esports", topics: ["PlayStation vs Xbox", "PC Gaming", "Classic Arcades (Mario, Pac-Man)"] },
=======
    slug: "awards-achievements",
    name: "Awards & Honors",
    nameHi: "पुरस्कार व सम्मान",
    icon: "🏆",
    example: "Bharat Ratna, Nobel, Oscars",
    chip: "all",
    description: "Civilian honors, Nobel prizes, Gallantry medals, Oscars, Academy awards, and sports trophies.",
    descriptionHi: "भारत रत्न, पद्म पुरस्कार, नोबेल पुरस्कार, ऑस्कर, ज्ञानपीठ और राजीव गांधी खेल रत्न।",
    subcategories: [
      { name: "Indian Civilian & Military Awards", slug: "indian-awards", topics: ["Bharat Ratna", "Padma Vibhushan / Bhushan / Shri", "Param Vir Chakra"] },
      { name: "Global Laurels", slug: "global-awards", topics: ["Nobel Prize History", "Academy Awards (Oscars)", "Grammy Awards", "Pulitzer Prize"] },
      { name: "Sports & Literature Honors", slug: "sports-lit-awards", topics: ["Khel Ratna & Arjuna", "Dronacharya", "Sahitya Akademi", "Jnanpith Award"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 36,
<<<<<<< HEAD
    slug: "inventions-discoveries",
    name: "Inventions & Discoveries",
    nameHi: "आविष्कार व खोजें",
    icon: "💡",
    example: "Electricity, Telephone, Vaccines",
    chip: "science",
    description: "World-changing inventions, discovery of antibiotics, electricity, internet, and inventors.",
    descriptionHi: "बिजली का आविष्कार, टेलीफोन, इंटरनेट, वैक्सीन और दुनिया बदलने वाले महान वैज्ञानिक।",
    subcategories: [
      { name: "Scientific Breakthroughs", slug: "breakthroughs", topics: ["Medical Discoveries (Penicillin, Vaccines)", "Industrial Inventions (Steam Engine, Printing Press)"] },
=======
    slug: "brands-companies",
    name: "Brands & Companies",
    nameHi: "कंपनियां व ब्रांड्स",
    icon: "🏷️",
    example: "Tata, Reliance, Apple, Google",
    chip: "all",
    description: "Iconic company founders, brand logos, corporate slogans, product histories, and mega-mergers.",
    descriptionHi: "टाटा, रिलायंस, एप्पल, गूगल, माइक्रोसॉफ्ट सहित प्रमुख कंपनियों का इतिहास और लोगो।",
    subcategories: [
      { name: "Indian Conglomerates", slug: "indian-companies", topics: ["Tata Group", "Reliance Industries", "Adani Group", "Infosys & Wipro"] },
      { name: "Global Tech Giants", slug: "global-companies", topics: ["Apple & Microsoft", "Google & Alphabet", "Amazon & Meta", "Tesla"] },
      { name: "Logos & Taglines", slug: "logos-taglines", topics: ["Iconic Logos", "Famous Slogans", "Brand Mascots", "Founding Years"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 37,
<<<<<<< HEAD
    slug: "travel-tourism",
    name: "Travel & Tourism",
    nameHi: "पर्यटन व यात्रा",
    icon: "✈️",
    example: "Hill Stations, Beaches, World Wonders",
    chip: "cities",
    description: "World travel destinations, famous hill stations, pristine beaches, and tourism spots.",
    descriptionHi: "भारत और विश्व के प्रमुख पर्यटन स्थल, हिल स्टेशन, समुद्र तट और यात्रा गाइड।",
    subcategories: [
      { name: "Destinations", slug: "destinations", topics: ["Seven Wonders of World", "Himalayan Hill Stations", "Beaches of Goa & Kerala"] },
=======
    slug: "lifestyle-everyday-knowledge",
    name: "Everyday Knowledge",
    nameHi: "दैनिक जीवन व ज्ञान",
    icon: "💡",
    example: "Health, Habits, Civics",
    chip: "all",
    description: "Daily life facts, consumer rights, traffic signs, first aid, etiquette, and domestic wisdom.",
    descriptionHi: "दैनिक जीवन के व्यावहारिक नियम, ट्रैफिक संकेत, उपभोक्ता अधिकार और प्राथमिक उपचार।",
    subcategories: [
      { name: "Civic Sense & Rights", slug: "civic-sense", topics: ["Traffic Rules & Signs", "Consumer Protection Act", "RTI Basics", "Emergency Helpline Numbers"] },
      { name: "Health & Domestic Science", slug: "domestic-science", topics: ["First Aid & CPR", "Food Preservation", "Home Safety", "Personal Hygiene"] },
>>>>>>> backup-today-pre-merge
    ],
  },
  {
    id: 38,
    slug: "theatre-performing-arts",
    name: "Theatre & Performing Arts",
    nameHi: "रंगमंच व नाट्य कला",
    icon: "🎭",
    example: "Drama, Broadway, Street Plays",
    chip: "cinema",
    description: "Traditional Sanskrit theatre, Broadway musicals, folk puppetry, and street plays.",
    descriptionHi: "भारतीय नाट्य परंपरा, नौटंकी, कठपुतली कला, नुक्कड़ नाटक और वैश्विक रंगमंच।",
    subcategories: [
      { name: "Folk Theatre", slug: "folk-theatre", topics: ["Nautanki", "Yakshagana", "Bhavai", "Puppet Shows (Kathputli)"] },
      { name: "Modern Theatre & Puppetry", slug: "modern-theatre", topics: ["Nukkad Natak (Street Theatre)", "Kathputli & Shadow Puppetry", "Famous Playwrights"] },
    ],
  },
  {
    id: 39,
    slug: "plants-agriculture",
    name: "Plants & Agriculture",
    nameHi: "कृषि व वनस्पति",
    icon: "🌱",
    example: "Crops, Trees, Medicinal Plants",
    chip: "science",
    description: "Indian agriculture, Green Revolution, cash crops, medicinal botany, photosynthesis, and forests.",
    descriptionHi: "भारतीय कृषि, हरित क्रांति, रबी-खरीफ फसलें, औषधीय पौधे, वनस्पति विज्ञान और मिट्टी।",
    subcategories: [
      { name: "Indian Agriculture & Crops", slug: "agriculture", topics: ["Rabi & Kharif Crops", "Green Revolution & M.S. Swaminathan", "Irrigation Systems", "Cash Crops"] },
      { name: "Botany & Medicinal Plants", slug: "botany", topics: ["Ayurvedic Herbs (Tulsi, Neem)", "Photosynthesis", "Carnivorous Plants", "Tree Longevity"] },
    ],
  },
  {
    id: 40,
    slug: "inventions-discoveries",
    name: "Inventions & Discoveries",
    nameHi: "आविष्कार व खोजें",
    icon: "💡",
    example: "Electricity, Wheel, Telephone",
    chip: "science",
    description: "Historical breakthroughs: electricity, telephone, penicillin, printing press, steam engine.",
    descriptionHi: "मानव इतिहास के महान आविष्कार: पहिया, बिजली, टेलीफोन, पेनिसिलिन, इंटरनेट और उनके वैज्ञानिक।",
    subcategories: [
      { name: "Era-Defining Inventions", slug: "major-inventions", topics: ["Steam Engine & Industrial Era", "Electricity & Light Bulb", "Telephone & Radio", "Printing Press"] },
      { name: "Medical Discoveries", slug: "medical-discoveries", topics: ["Vaccines (Smallpox, Polio)", "Penicillin & Antibiotics", "X-Rays", "DNA Double Helix"] },
    ],
  },
  {
    id: 41,
    slug: "travel-tourism",
    name: "Travel & Tourism",
    nameHi: "पर्यटन व यात्रा",
    icon: "🧳",
    example: "Hill Stations, Beaches, Pilgrimages",
    chip: "all",
    description: "Scenic hill stations of India, coastal beaches, pilgrimage circuits, and world tourist hubs.",
    descriptionHi: "शिमला, मनाली, गोवा, केरल, चार धाम यात्रा, हिल स्टेशन और विश्व पर्यटन स्थल।",
    subcategories: [
      { name: "Indian Hill Stations & Nature", slug: "hill-stations", topics: ["Himalayan Retreats (Manali, Shimla)", "Western Ghats (Munnar, Ooty)", "Beaches of Goa & Andaman"] },
      { name: "Pilgrimage Circuits", slug: "pilgrimages", topics: ["Char Dham", "12 Jyotirlingas", "Buddhist Circuit", "Golden Triangle (Delhi-Agra-Jaipur)"] },
    ],
  },
  {
    id: 42,
    slug: "kids-family-quiz",
    name: "Kids & Family Quiz",
    nameHi: "बाल एवं पारिवारिक क्विज़",
    icon: "🧸",
    example: "Cartoons, Rhymes, Fairy Tales",
    chip: "fun",
    description: "Fun cartoon characters, nursery rhymes, bedtime fables, fairy tales, and family games.",
    descriptionHi: "कार्टून, बाल कहानियां, परियों की दुनिया, पंचतंत्र की कथाएं और बच्चों के लिए आसान क्विज़।",
    subcategories: [
      { name: "Cartoons & Tales", slug: "cartoons-tales", topics: ["Panchatantra Stories", "Disney Characters", "Superhero Trivia", "Nursery Rhymes"] },
      { name: "Primary School Trivia", slug: "primary-trivia", topics: ["Colors & Shapes", "Animal Sounds", "Solar System for Kids", "Good Habits"] },
    ],
  },
  {
    id: 43,
    slug: "fun-viral-quiz",
    name: "Fun & Viral Quiz",
    nameHi: "फन व वायरल क्विज़",
    icon: "🎯",
    example: "Memes, Pop Culture, Trends",
    chip: "fun",
    description: "Trending pop culture, viral internet sensations, meme trivia, and party games.",
    descriptionHi: "इंटरनेट मीम्स, सोशल मीडिया ट्रेंड्स, वायरल फैक्ट्स और दोस्तों के साथ खेलने वाले क्विज़।",
    subcategories: [
      { name: "Meme Culture & Trends", slug: "memes-trends", topics: ["Viral Trends", "Internet Slang", "Meme Trivia", "Party Game Questions"] },
    ],
  },
];

/**
 * Curated Quick Filter Chip Definitions
 */
export const QUICK_FILTER_CHIPS = [
  { id: "all", label: "All Quizzes", labelHi: "सभी क्विज़", icon: "🌐" },
  { id: "india-gk", label: "India GK", labelHi: "भारत GK", icon: "🇮🇳" },
  { id: "science", label: "Science & Tech", labelHi: "विज्ञान", icon: "🔬" },
  { id: "sports", label: "Sports", labelHi: "खेल", icon: "⚽" },
  { id: "cities", label: "Cities", labelHi: "शहर", icon: "🏙️" },
  { id: "states", label: "States", labelHi: "राज्य", icon: "🏛️" },
  { id: "cinema", label: "Cinema & Fun", labelHi: "सिनेमा", icon: "🎬" },
  { id: "space", label: "Space", labelHi: "अंतरिक्ष", icon: "🚀" },
  { id: "fun", label: "Brain & Fun", labelHi: "मजेदार", icon: "🎯" },
];

/**
 * Canonical Alias Mapping for legacy slugs
 */
export const ALIAS_MAP = {
  "ancient-medieval-indian-history": "india-history",
  "history": "india-history",
  "indian-history": "india-history",
  "indian-geography": "india-geography",
  "geography": "india-geography",
  "space-astronomy": "space-universe",
  "business-economy": "money-business",
  "environment-nature": "animals-nature",
  "animals-wildlife": "animals-nature",
  "reasoning-brain-games": "brain-riddles",
  "food-cuisine": "food",
};

/**
 * Helper to get a Main Category by its slug or id
 */
export function getMainCategoryBySlug(slug) {
  if (!slug) return null;
  const clean = String(slug).toLowerCase().trim();
  const canonicalSlug = ALIAS_MAP[clean] || clean;
  return (
    MAIN_CATEGORIES.find(
      (c) =>
        c.slug === canonicalSlug ||
        c.slug === clean ||
        c.name.toLowerCase() === clean ||
        c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === clean
    ) || null
  );
}

/**
 * Curated Quick Filter Chip Slug Mappings
 */
export const CHIP_CATEGORY_SLUGS = {
  all: null,
  "india-gk": [
    "india-gk",
    "india-history",
    "indian-history",
    "india-geography",
    "indian-geography",
    "indian-cities",
    "indian-states-uts",
    "politics-government",
    "art-culture",
    "indian-kingdoms",
    "religion-spirituality",
    "heritage-monuments",
    "defence-military",
    "transport",
  ],
  science: [
    "science",
    "human-body",
    "technology",
    "space-universe",
    "space-astronomy",
    "animals-nature",
    "plants-agriculture",
    "mathematics",
    "inventions-discoveries",
  ],
  sports: ["sports", "gaming"],
  cities: ["indian-cities", "travel-tourism"],
  states: ["indian-states-uts", "indian-geography", "india-geography"],
  cinema: ["entertainment", "music", "theatre-performing-arts"],
  space: ["space-universe", "space-astronomy", "science"],
  fun: ["brain-riddles", "amazing-facts", "food", "food-cuisine", "fun-viral-quiz", "kids-family-quiz", "gaming", "reasoning-brain-games"],
};

export function filterCategoriesByChip(categories, chipId) {
  if (!chipId || chipId === "all") return categories;
  const targetSlugs = CHIP_CATEGORY_SLUGS[chipId];
  if (!targetSlugs) return categories;
  return categories.filter((c) => targetSlugs.includes(c.slug));
}
