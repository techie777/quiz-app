// src/lib/mainCategoriesConfig.js

/**
 * Canonical Main Categories
 * Ordered precisely to customer specifications & featured sequence:
 * 1. India GK
 * 2. World GK
 * 3. India History
 * 4. India Geography
 * 5. India Sports
 * 6. Technology
 * 7. Science & Discovery
 * 8. Entertainment
 * 9. Economy & Others
 * 10. Biology GK
 * 11. Nature & Wonders
 * 12. Indian Culture
 * 13. India Polity
 * 14. Others
 * Followed by all remaining unique categories (no duplicates).
 */

export const MAIN_CATEGORIES = [
  {
    "id": 1,
    "slug": "india-gk",
    "name": "India GK",
    "nameHi": "भारत सामान्य ज्ञान",
    "icon": "🇮🇳",
    "example": "Indian History, Polity, Science",
    "chip": "india-gk",
    "description": "Explore the comprehensive trivia, heritage, politics, and achievements of India.",
    "subcategories": [
      {
        "name": "India History",
        "nameHi": "भारतीय इतिहास",
        "slug": "india-history",
        "icon": "📜",
        "topics": [
          "Ancient India",
          "Medieval India",
          "Freedom Struggle",
          "Indian Forts & Architecture",
          "Tribes & Heritage",
          "Post-Independence"
        ]
      },
      {
        "name": "India Geography",
        "nameHi": "भारतीय भूगोल",
        "slug": "india-geography",
        "icon": "🗺️",
        "topics": [
          "Himalayas & Mountains",
          "Rivers & Water Systems",
          "Climate & Monsoons",
          "Forests & Wildlife",
          "States & Capitals",
          "Coastal & Island Regions"
        ]
      },
      {
        "name": "India Sports",
        "nameHi": "भारतीय खेल",
        "slug": "india-sports",
        "icon": "🏏",
        "topics": [
          "Cricket & IPL",
          "Olympic Achievements",
          "Traditional Indian Sports",
          "Sports Personalities & Awards",
          "Hockey & National Games"
        ]
      },
      {
        "name": "Technology",
        "nameHi": "प्रौद्योगिकी व आईटी",
        "slug": "technology",
        "icon": "💻",
        "topics": [
          "Computers & Software",
          "Digital India & IT",
          "AI, Robotics & Innovations",
          "Cybersecurity & Internet"
        ]
      },
      {
        "name": "Science & Discovery",
        "nameHi": "विज्ञान और खोज",
        "slug": "science--discovery",
        "icon": "🔬",
        "topics": [
          "Physics & Natural Laws",
          "Chemistry in Daily Life",
          "Daily Science",
          "Space & ISRO Missions",
          "Inventions & Discoveries"
        ]
      },
      {
        "name": "Entertainment",
        "nameHi": "मनोरंजन, कला व संस्कृति",
        "slug": "entertainment",
        "icon": "🎭",
        "topics": [
          "Indian Cinema & Bollywood",
          "Music & Dance Traditions",
          "Festivals & Fairs",
          "Folk Art & Theatre",
          "Literature & Awards"
        ]
      },
      {
        "name": "Economy & Others",
        "nameHi": "भारतीय अर्थव्यवस्था व अन्य",
        "slug": "economy--others",
        "icon": "📊",
        "topics": [
          "Banking & RBI",
          "Indian Rupee & Currency",
          "Markets & Commerce",
          "Budget & Five Year Plans",
          "Economic Milestones"
        ]
      },
      {
        "name": "Biology GK",
        "nameHi": "जीव विज्ञान सामान्य ज्ञान",
        "slug": "biology-gk-1",
        "icon": "🧬",
        "topics": [
          "Human Body & Health",
          "Cell Biology & Genetics",
          "Vitamins & Nutrition",
          "Diseases & Immunity",
          "Plant & Animal Biology"
        ]
      },
      {
        "name": "Nature & Wonders",
        "nameHi": "प्रकृति और अजूबे",
        "slug": "nature-animals",
        "icon": "🌿",
        "topics": [
          "Natural Wonders",
          "National Parks & Sanctuaries",
          "Wildlife & Big Cats",
          "Forests & Flora",
          "Rivers & Valleys"
        ]
      },
      {
        "name": "Indian Culture",
        "nameHi": "भारतीय संस्कृति व धरोहर",
        "slug": "india-culture",
        "icon": "🪔",
        "topics": [
          "Tribes & Heritage",
          "Classical Dances & Music",
          "Festivals & Traditions",
          "Folk Crafts & Paintings",
          "Sacred Heritage Sites"
        ]
      },
      {
        "name": "India Polity",
        "nameHi": "भारतीय राजव्यवस्था व संविधान",
        "slug": "india-polity",
        "icon": "⚖️",
        "topics": [
          "Indian Constitution",
          "Fundamental Rights & Duties",
          "Parliament & Judiciary",
          "Elections & Governance",
          "National Symbols & Laws"
        ]
      },
      {
        "name": "Others",
        "nameHi": "अन्य सामान्य ज्ञान",
        "slug": "others",
        "icon": "📦",
        "topics": [
          "Food & Spices",
          "Indian Railway",
          "Currency & Language",
          "Flag & Rules",
          "Unique Village",
          "Amazing & Curious Facts",
          "Brain & Fun"
        ]
      }
    ]
  },
  {
    "id": 2,
    "slug": "world-gk",
    "name": "World GK",
    "nameHi": "विश्व सामान्य ज्ञान",
    "icon": "🌍",
    "example": "Countries, Capitals, World History",
    "chip": "all",
    "description": "Global knowledge covering continents, nations, international organizations, and records.",
    "descriptionHi": "विश्व के देश, राजधानियां, मुद्राएं, संयुक्त राष्ट्र, वैश्विक इतिहास और भूगोल।",
    "subcategories": [
      {
        "name": "World Geography",
        "slug": "world-geography",
        "topics": [
          "Continents",
          "Oceans & Seas",
          "Capitals & Currencies",
          "World Mountains"
        ]
      },
      {
        "name": "World History",
        "slug": "world-history",
        "topics": [
          "Ancient Civilizations",
          "World Wars",
          "Renaissance",
          "Great Empires"
        ]
      },
      {
        "name": "World Organizations",
        "slug": "world-organizations",
        "topics": [
          "United Nations",
          "WHO",
          "UNESCO",
          "World Bank & IMF"
        ]
      },
      {
        "name": "World Records",
        "slug": "world-records",
        "topics": [
          "Highest & Longest",
          "First in the World",
          "Guinness Records"
        ]
      },
      {
        "name": "Famous World Leaders",
        "slug": "world-leaders",
        "topics": [
          "Historical Figures",
          "Statesmen",
          "Nobel Laureates"
        ]
      }
    ]
  },
  {
    "id": 3,
    "slug": "india-history",
    "name": "India History",
    "nameHi": "भारतीय इतिहास",
    "icon": "📜",
    "example": "Ancient, Medieval, Modern & Freedom Struggle",
    "chip": "india-gk",
    "description": "Chronicles of ancient civilizations, mighty dynasties, independence struggles, and visionary leaders.",
    "descriptionHi": "प्राचीन भारत, सिंधु घाटी, मौर्य-गुप्त काल, स्वतंत्रता संग्राम और आधुनिक भारत का गौरवशाली इतिहास।",
    "subcategories": [
      {
        "name": "Ancient India",
        "slug": "ancient-india",
        "topics": [
          "Indus Valley Civilization",
          "Vedic Age",
          "Mauryan Empire",
          "Gupta Golden Age"
        ]
      },
      {
        "name": "Medieval India",
        "slug": "medieval-india",
        "topics": [
          "Delhi Sultanate",
          "Mughal Empire",
          "Maratha Empire",
          "Bhakti & Sufi Movement"
        ]
      },
      {
        "name": "Freedom Struggle",
        "slug": "freedom-struggle",
        "topics": [
          "1857 Revolt",
          "Gandhian Era",
          "Revolutionaries",
          "Partition & Independence"
        ]
      },
      {
        "name": "Post-Independence",
        "slug": "post-independence",
        "topics": [
          "Integration of States",
          "Wars & Treaties",
          "Revolutions & Progress"
        ]
      }
    ]
  },
  {
    "id": 4,
    "slug": "india-geography",
    "name": "India Geography",
    "nameHi": "भारतीय भूगोल",
    "icon": "🗺️",
    "example": "States, Rivers, Mountains, Climate",
    "chip": "states",
    "description": "Himalayas, peninsular rivers, monsoon patterns, soil types, and regional geography.",
    "descriptionHi": "भारत की नदियां, पर्वतमालाएं, जलवायु, मिट्टी, राष्ट्रीय उद्यान और प्राकृतिक संपदा।",
    "subcategories": [
      {
        "name": "Himalayan & Peninsular Rivers",
        "slug": "rivers",
        "topics": [
          "Ganga Basin",
          "Indus System",
          "Godavari & Krishna",
          "Narmada & Tapi"
        ]
      },
      {
        "name": "Mountains & Plateaus",
        "slug": "mountains",
        "topics": [
          "Himalayas",
          "Western Ghats",
          "Eastern Ghats",
          "Deccan Plateau"
        ]
      },
      {
        "name": "Climate & Monsoon",
        "slug": "climate",
        "topics": [
          "Southwest Monsoon",
          "Winter Rains",
          "Cyclones",
          "Rainfall Zones"
        ]
      },
      {
        "name": "Forests & Wildlife Reserves",
        "slug": "forests-parks",
        "topics": [
          "National Parks",
          "Tiger Reserves",
          "Bird Sanctuaries",
          "Wetlands"
        ]
      }
    ]
  },
  {
    "id": 5,
    "slug": "india-sports",
    "name": "India Sports",
    "nameHi": "भारतीय खेल",
    "icon": "🏏",
    "example": "Cricket, IPL, Olympic Medals, Traditional Sports",
    "chip": "sports",
    "description": "Cricket, IPL records, Indian Olympic achievements, traditional games, and athletic legends.",
    "descriptionHi": "क्रिकेट, आईपीएल रिकॉर्ड, भारतीय ओलंपिक पदक विजेता, पारंपरिक खेल और खेल रत्न पुरस्कार।",
    "subcategories": [
      {
        "name": "Cricket & IPL",
        "slug": "cricket",
        "topics": [
          "World Cups",
          "IPL Records",
          "Indian Cricket Legends",
          "Test Cricket",
          "T20 Trivia"
        ]
      },
      {
        "name": "Football & Leagues",
        "slug": "football",
        "topics": [
          "FIFA World Cup",
          "UEFA Champions League",
          "Messi & Ronaldo",
          "ISL"
        ]
      },
      {
        "name": "Olympics & Athletics",
        "slug": "olympics",
        "topics": [
          "Olympic History",
          "Indian Medalists",
          "Track & Field",
          "Paralympics"
        ]
      },
      {
        "name": "Racket & Board Sports",
        "slug": "other-sports",
        "topics": [
          "Badminton",
          "Tennis Grand Slams",
          "Chess Grandmasters",
          "Hockey"
        ]
      }
    ]
  },
  {
    "id": 6,
    "slug": "technology",
    "name": "Technology",
    "nameHi": "प्रौद्योगिकी व आईटी",
    "icon": "💻",
    "example": "Computers, AI, Internet",
    "chip": "science",
    "description": "Artificial intelligence, software, coding, smartphones, cybersecurity, and future tech.",
    "descriptionHi": "कंप्यूटर, कृत्रिम बुद्धिमत्ता (AI), इंटरनेट, सॉफ्टवेयर, प्रोग्रामिंग और गैजेट्स।",
    "subcategories": [
      {
        "name": "Computers & Software",
        "slug": "computers",
        "topics": [
          "Operating Systems",
          "Programming Languages",
          "Hardware Basics",
          "Cloud Computing"
        ]
      },
      {
        "name": "AI & Modern Tech",
        "slug": "ai-modern",
        "topics": [
          "Artificial Intelligence",
          "Robotics",
          "Machine Learning",
          "Smartphones & Apps"
        ]
      },
      {
        "name": "Cybersecurity & Internet",
        "slug": "cyber-internet",
        "topics": [
          "Cyber Safety",
          "Networking Protocols",
          "Social Media",
          "Digital Payments"
        ]
      }
    ]
  },
  {
    "id": 7,
    "slug": "science--discovery",
    "name": "Science & Discovery",
    "nameHi": "विज्ञान और खोज",
    "icon": "🔬",
    "example": "Physics, Chemistry, Daily Science, Inventions",
    "chip": "science",
    "description": "Fundamental laws of nature, chemical elements, daily life scientific phenomena, and monumental discoveries.",
    "descriptionHi": "भौतिक विज्ञान, रसायन विज्ञान, दैनिक विज्ञान, अंतरिक्ष अनुसंधान और ऐतिहासिक वैज्ञानिक खोजें।",
    "subcategories": [
      {
        "name": "Physics & Laws",
        "slug": "physics",
        "topics": [
          "Mechanics & Motion",
          "Optics & Light",
          "Electricity & Magnetism",
          "Thermodynamics",
          "Modern Physics"
        ]
      },
      {
        "name": "Chemistry in Daily Life",
        "slug": "chemistry",
        "topics": [
          "Periodic Table",
          "Chemical Reactions",
          "Acids & Bases",
          "Organic Compounds",
          "Everyday Chemistry"
        ]
      },
      {
        "name": "Space & ISRO Missions",
        "slug": "space-isro",
        "topics": [
          "Chandrayaan & Mangalyaan",
          "Aditya-L1",
          "Gaganyaan",
          "Satellites & Rockets"
        ]
      },
      {
        "name": "Scientific Discoveries",
        "slug": "scientific-discoveries",
        "topics": [
          "Famous Inventions",
          "Nobel Laureates in Science",
          "Great Discoveries",
          "Indian Scientists"
        ]
      }
    ]
  },
  {
    "id": 8,
    "slug": "entertainment",
    "name": "Entertainment",
    "nameHi": "मनोरंजन व सिनेमा",
    "icon": "🎬",
    "example": "Bollywood, Movies, TV",
    "chip": "cinema",
    "description": "Bollywood, regional Indian cinema, Hollywood, famous dialogues, actors, and TV series.",
    "descriptionHi": "बॉलीवुड, दक्षिण भारतीय सिनेमा, हॉलीवुड, प्रसिद्ध डायलॉग्स, गाने और अभिनेता।",
    "subcategories": [
      {
        "name": "Bollywood Cinema",
        "slug": "bollywood",
        "topics": [
          "Classic Movies",
          "Iconic Dialogues",
          "Superstars",
          "Music Directors"
        ]
      },
      {
        "name": "Regional Indian Cinema",
        "slug": "regional-cinema",
        "topics": [
          "South Cinema (Tollywood, Kollywood)",
          "Bengali Cinema",
          "Marathi Cinema"
        ]
      },
      {
        "name": "Hollywood & Global Film",
        "slug": "hollywood",
        "topics": [
          "Oscar Winners",
          "Blockbusters",
          "Franchises (Marvel, DC)",
          "Directors"
        ]
      },
      {
        "name": "TV Shows & Web Series",
        "slug": "shows-series",
        "topics": [
          "Indian Television",
          "OTT Web Series",
          "Reality Shows",
          "Sitcoms"
        ]
      }
    ]
  },
  {
    "id": 9,
    "slug": "economy--others",
    "name": "Economy & Others",
    "nameHi": "भारतीय अर्थव्यवस्था व अन्य",
    "icon": "📊",
    "example": "Banking, RBI, Markets, Schemes",
    "chip": "india-gk",
    "description": "Comprehensive trivia on Indian banking, currency, markets, fiscal reforms, and economic achievements.",
    "descriptionHi": "भारतीय बैंकिंग व्यवस्था, रिजर्व बैंक (RBI), बजट, शेयर बाजार, मुद्रा और सरकारी आर्थिक योजनाएं।",
    "subcategories": [
      {
        "name": "Banking & RBI",
        "slug": "banking-rbi",
        "topics": [
          "Reserve Bank of India",
          "Public & Private Banks",
          "Monetary Policy",
          "Digital Banking & UPI"
        ]
      },
      {
        "name": "Currency & Fiscal Policies",
        "slug": "currency-fiscal",
        "topics": [
          "Indian Rupee & Symbols",
          "Union Budget",
          "GST & Taxation",
          "Five Year Plans"
        ]
      },
      {
        "name": "Markets & Commerce",
        "slug": "markets-commerce",
        "topics": [
          "Stock Exchange (BSE & NSE)",
          "Trade & Exports",
          "Agriculture & Industry",
          "Economic Milestones"
        ]
      }
    ]
  },
  {
    "id": 10,
    "slug": "biology-gk-1",
    "name": "Biology GK",
    "nameHi": "जीव विज्ञान सामान्य ज्ञान",
    "icon": "🧬",
    "example": "Human Body, Health, Genetics & Diseases",
    "chip": "science",
    "description": "Explore human anatomy, organ systems, genetics, vitamins, and medical milestones.",
    "descriptionHi": "मानव शरीर के अंग, रक्त परिसंचरण, आनुवंशिकी, पोषक तत्व, विटामिन और रोग विज्ञान।",
    "subcategories": [
      {
        "name": "Human Body & Health",
        "slug": "human-body-health",
        "topics": [
          "Brain & Nervous System",
          "Heart & Blood Circulation",
          "Bones & Muscles",
          "Digestive & Respiratory System"
        ]
      },
      {
        "name": "Nutrients & Vitamins",
        "slug": "nutrients-vitamins",
        "topics": [
          "Vitamins & Deficiencies",
          "Minerals & Nutrition",
          "Immunity & Balanced Diet"
        ]
      },
      {
        "name": "Diseases & Medical Science",
        "slug": "diseases-medical",
        "topics": [
          "Viral & Bacterial Diseases",
          "Vaccines & Discoveries",
          "Medical Instruments"
        ]
      }
    ]
  },
  {
    "id": 11,
    "slug": "nature-animals",
    "name": "Nature & Wonders",
    "nameHi": "प्रकृति और अजूबे",
    "icon": "🌿",
    "example": "National Parks, Natural Wonders & Wildlife",
    "chip": "india-gk",
    "description": "India's breathtaking biodiversity, wildlife sanctuaries, tiger reserves, and natural wonders.",
    "descriptionHi": "भारत के राष्ट्रीय उद्यान, टाइगर रिजर्व, प्राकृतिक अजूबे, पशु-पक्षी और समृद्ध जैव विविधता।",
    "subcategories": [
      {
        "name": "Natural Wonders",
        "slug": "natural-wonders",
        "topics": [
          "Waterfalls & Caves",
          "Living Root Bridges",
          "Valley of Flowers",
          "Geological Wonders"
        ]
      },
      {
        "name": "National Parks & Wildlife",
        "slug": "national-parks",
        "topics": [
          "Tiger Reserves & Project Tiger",
          "Big Cats of India",
          "Bird Sanctuaries",
          "Endangered Species"
        ]
      },
      {
        "name": "Forests & Ecology",
        "slug": "forests-ecology",
        "topics": [
          "Mangroves & Sundarbans",
          "Western Ghats Biodiversity",
          "Himalayan Flora & Fauna"
        ]
      }
    ]
  },
  {
    "id": 12,
    "slug": "india-culture",
    "name": "Indian Culture",
    "nameHi": "भारतीय संस्कृति व धरोहर",
    "icon": "🪔",
    "example": "Tribes, Classical Dances, Arts & Festivals",
    "chip": "india-gk",
    "description": "Timeless traditions, tribal heritage, classical dances, music, and sacred cultural festivals of India.",
    "descriptionHi": "भारत की समृद्ध सांस्कृतिक धरोहर, जनजातियां, शास्त्रीय नृत्य, लोक कलाएं और पारंपरिक उत्सव।",
    "subcategories": [
      {
        "name": "Tribes & Heritage",
        "slug": "tribes-heritage",
        "topics": [
          "Major Indian Tribes",
          "Tribal Traditions & Art",
          "Folk Lifestyle & Customs"
        ]
      },
      {
        "name": "Classical Dance & Music",
        "slug": "classical-dance-music",
        "topics": [
          "8 Classical Dances",
          "Hindustani & Carnatic Music",
          "Folk Dances (Garba, Bhangra, Bihu)"
        ]
      },
      {
        "name": "Festivals & Folk Crafts",
        "slug": "festivals-crafts",
        "topics": [
          "Cultural Festivals & Fairs",
          "Handicrafts & Textiles",
          "Folk Paintings (Madhubani, Warli)"
        ]
      }
    ]
  },
  {
    "id": 13,
    "slug": "india-polity",
    "name": "India Polity",
    "nameHi": "भारतीय राजव्यवस्था व संविधान",
    "icon": "⚖️",
    "example": "Constitution, Parliament, Rights, Judiciary",
    "chip": "india-gk",
    "description": "Constitution of India, parliamentary democracy, fundamental rights, judiciary, and governance.",
    "descriptionHi": "भारतीय संविधान, संसद, राष्ट्रपति, चुनाव आयोग, मौलिक अधिकार और प्रशासनिक व्यवस्था।",
    "subcategories": [
      {
        "name": "Constitution & Law",
        "slug": "constitution",
        "topics": [
          "Preamble & Articles",
          "Fundamental Rights",
          "Constitutional Amendments",
          "Judiciary"
        ]
      },
      {
        "name": "Parliament & Executive",
        "slug": "parliament-executive",
        "topics": [
          "Lok Sabha & Rajya Sabha",
          "President & Prime Minister",
          "Cabinet Ministries"
        ]
      },
      {
        "name": "Elections & Governance",
        "slug": "elections-governance",
        "topics": [
          "Election Commission",
          "EVM & Voting",
          "State Legislatures",
          "Panchayati Raj"
        ]
      }
    ]
  },
  {
    "id": 14,
    "slug": "others",
    "name": "Others",
    "nameHi": "अन्य सामान्य ज्ञान",
    "icon": "📦",
    "example": "Railway, Spices, Flags, Unique Facts & More",
    "chip": "india-gk",
    "description": "Special curated trivia from Indian railways, food & spices, flags, records, and amazing curiosities.",
    "descriptionHi": "भारतीय रेलवे, खानपान व मसाले, तिरंगा नियम, अनोखे गांव और रोचक तथ्य।",
    "subcategories": [
      {
        "name": "Food & Spices",
        "slug": "food-spices",
        "topics": [
          "Indian Spices & Origins",
          "Traditional Dishes & Regional Tastes",
          "Culinary Trivia"
        ]
      },
      {
        "name": "Indian Railway",
        "slug": "indian-railway",
        "topics": [
          "History of Indian Railways",
          "Famous Trains & Vande Bharat",
          "Railway Zones & Records"
        ]
      },
      {
        "name": "Currency, Language & Flag",
        "slug": "currency-language-flag",
        "topics": [
          "National Flag & Rules",
          "Currency Notes & Symbols",
          "Official Languages & Scripts"
        ]
      },
      {
        "name": "Curiosities & Facts",
        "slug": "curiosities-facts",
        "topics": [
          "Unique Villages of India",
          "Post Office Records",
          "Amazing & Curious Facts",
          "Brain & Fun Riddles"
        ]
      }
    ]
  },
  {
    "id": 15,
    "slug": "religion-spirituality",
    "name": "Religion & Spirituality",
    "nameHi": "धर्म और आध्यात्म",
    "icon": "🙏",
    "example": "Hinduism, Buddhism, Jainism",
    "chip": "all",
    "description": "Sacred scriptures, epics, deities, philosophical schools, festivals, and world religions.",
    "descriptionHi": "रामायण, महाभारत, वेद, उपनिषद, बौद्ध, जैन, सिख व विश्व धर्मों का पावन ज्ञान।",
    "subcategories": [
      {
        "name": "Hinduism & Epics",
        "slug": "hinduism",
        "topics": [
          "Ramayana",
          "Mahabharata",
          "Vedas & Upanishads",
          "Bhagavad Gita",
          "Puranas"
        ]
      },
      {
        "name": "Buddhism & Jainism",
        "slug": "buddhism-jainism",
        "topics": [
          "Lord Buddha & Teachings",
          "Tirthankaras",
          "Mahavira",
          "Sacred Sites"
        ]
      },
      {
        "name": "Sikhism & Gurus",
        "slug": "sikhism",
        "topics": [
          "Ten Sikh Gurus",
          "Guru Granth Sahib",
          "Golden Temple",
          "Festivals"
        ]
      },
      {
        "name": "World Religions",
        "slug": "world-religions",
        "topics": [
          "Islam",
          "Christianity",
          "Judaism",
          "Zoroastrianism"
        ]
      }
    ]
  },
  {
    "id": 12,
    "slug": "indian-states-uts",
    "name": "Indian States & UTs",
    "nameHi": "भारतीय राज्य व केंद्र शासित प्रदेश",
    "icon": "🏛️",
    "example": "Rajasthan, MP, UP, Kerala",
    "chip": "states",
    "description": "Dedicated quizzes for each of India's 28 states and 8 union territories.",
    "descriptionHi": "राजस्थान, मध्य प्रदेश, उत्तर प्रदेश, केरल सहित सभी 28 राज्यों और 8 केंद्र शासित प्रदेशों का विशेष ज्ञान।",
    "subcategories": [
      {
        "name": "Northern States",
        "slug": "north-india",
        "topics": [
          "Uttar Pradesh",
          "Rajasthan",
          "Punjab",
          "Haryana",
          "Himachal Pradesh",
          "Uttarakhand"
        ]
      },
      {
        "name": "Central & Western States",
        "slug": "central-west-india",
        "topics": [
          "Madhya Pradesh",
          "Maharashtra",
          "Gujarat",
          "Chhattisgarh",
          "Goa"
        ]
      },
      {
        "name": "Southern States",
        "slug": "south-india",
        "topics": [
          "Tamil Nadu",
          "Karnataka",
          "Kerala",
          "Andhra Pradesh",
          "Telangana"
        ]
      },
      {
        "name": "Eastern & North-Eastern States",
        "slug": "east-northeast-india",
        "topics": [
          "Bihar",
          "West Bengal",
          "Odisha",
          "Assam",
          "Sikkim",
          "Seven Sisters"
        ]
      },
      {
        "name": "Union Territories",
        "slug": "union-territories",
        "topics": [
          "Delhi",
          "Jammu & Kashmir",
          "Ladakh",
          "Puducherry",
          "Andaman & Nicobar",
          "Chandigarh"
        ]
      }
    ]
  },
  {
    "id": 13,
    "slug": "indian-cities",
    "name": "Indian Cities",
    "nameHi": "भारत के प्रमुख शहर",
    "icon": "🏙️",
    "example": "Mumbai, Delhi, Indore, Jaipur",
    "chip": "cities",
    "description": "Famous urban hubs, metropolitan culture, food, landmarks, and city histories.",
    "descriptionHi": "इंदौर, मुंबई, दिल्ली, जयपुर, बेंगलुरु सहित भारत के प्रमुख शहरों का इतिहास, संस्कृति और पहचान।",
    "subcategories": [
      {
        "name": "Mega Metros",
        "slug": "metros",
        "topics": [
          "Delhi NCR",
          "Mumbai",
          "Bengaluru",
          "Kolkata",
          "Chennai",
          "Hyderabad"
        ]
      },
      {
        "name": "Heritage & Cultural Cities",
        "slug": "heritage-cities",
        "topics": [
          "Varanasi",
          "Jaipur",
          "Udaipur",
          "Amritsar",
          "Madurai"
        ]
      },
      {
        "name": "Clean & Smart Cities",
        "slug": "smart-cities",
        "topics": [
          "Indore",
          "Surat",
          "Bhopal",
          "Chandigarh",
          "Pune"
        ]
      }
    ]
  },
  {
    "id": 14,
    "slug": "human-body",
    "name": "Human Body",
    "nameHi": "मानव शरीर",
    "icon": "🫀",
    "example": "Organs, Anatomy, Health & Biology",
    "chip": "science",
    "description": "Fascinating anatomy, organs, brain functions, circulatory system, nutrients, and medical wonders.",
    "descriptionHi": "मानव शरीर की संरचना, हृदय, मस्तिष्क, पाचन तंत्र, रक्त समूह, विटामिन्स और स्वास्थ्य ज्ञान।",
    "subcategories": [
      {
        "name": "Vital Organs & Systems",
        "slug": "vital-organs",
        "topics": [
          "Heart & Circulation",
          "Brain & Nervous System",
          "Lungs & Respiration",
          "Digestive System"
        ]
      },
      {
        "name": "Skeletal & Muscular",
        "slug": "skeleton-muscles",
        "topics": [
          "Bones & Joints",
          "Muscles",
          "Skin & Hair",
          "Sensory Organs"
        ]
      },
      {
        "name": "Health & Nutrition",
        "slug": "health-nutrition",
        "topics": [
          "Vitamins & Minerals",
          "Immunity & Diseases",
          "Blood Groups",
          "First Aid"
        ]
      }
    ]
  },
  {
    "id": 15,
    "slug": "food",
    "name": "Food",
    "nameHi": "खानपान व व्यंजन",
    "icon": "🍕",
    "example": "Indian Food, World Food",
    "chip": "all",
    "description": "Traditional regional delicacies, street food classics, spices, and international culinary arts.",
    "descriptionHi": "भारतीय प्रांतीय व्यंजन, मिठाइयां, मसाले, स्ट्रीट फूड और वैश्विक खानपान।",
    "subcategories": [
      {
        "name": "Indian Regional Cuisines",
        "slug": "indian-regional",
        "topics": [
          "North Indian (Mughlai, Punjabi)",
          "South Indian (Dosa, Idli)",
          "Bengali Sweets",
          "Gujarati & Rajasthani Thali"
        ]
      },
      {
        "name": "Street Food & Snacks",
        "slug": "street-food",
        "topics": [
          "Chaat & Golgappe",
          "Samosa & Pakora",
          "Vada Pav & Pav Bhaji",
          "Famous Local Delicacies"
        ]
      },
      {
        "name": "Spices & Culinary Secrets",
        "slug": "spices-traditions",
        "topics": [
          "Indian Spices (Masale)",
          "Tea & Coffee Culture",
          "Festive Foods",
          "Cooking Techniques"
        ]
      },
      {
        "name": "World Cuisines",
        "slug": "world-cuisines",
        "topics": [
          "Italian (Pizza, Pasta)",
          "Asian (Sushi, Noodles)",
          "Mexican & Mediterranean",
          "Baking & Desserts"
        ]
      }
    ]
  },
  {
    "id": 16,
    "slug": "amazing-facts",
    "name": "Amazing Facts",
    "nameHi": "रोचक व आश्चर्यजनक तथ्य",
    "icon": "✨",
    "example": "Mind-blowing Facts, World Curiosities",
    "chip": "fun",
    "description": "Astonishing records, mind-boggling trivia, quirky natural phenomena, and fun facts.",
    "descriptionHi": "दुनिया के सबसे अनोखे रहस्य, चौंकाने वाले वैज्ञानिक तथ्य, अजब-गजब रिकॉर्ड्स और पहेलियां।",
    "subcategories": [
      {
        "name": "Nature & Animal Wonders",
        "slug": "nature-wonders",
        "topics": [
          "Bizarre Animals",
          "Natural Marvels",
          "Deep Sea Secrets"
        ]
      },
      {
        "name": "Human & Science Oddities",
        "slug": "science-oddities",
        "topics": [
          "Brain Quirks",
          "Space Mysteries",
          "Everyday Inventions"
        ]
      },
      {
        "name": "World Records & Curiosities",
        "slug": "world-curiosities",
        "topics": [
          "Guinness Records",
          "Ancient Mysteries",
          "Quirky Cultures"
        ]
      }
    ]
  },
  {
    "id": 17,
    "slug": "indian-kingdoms",
    "name": "India Kingdom",
    "nameHi": "भारतीय राजवंश व साम्राज्य",
    "icon": "👑",
    "example": "Maurya, Gupta, Chola, Maratha, Rajput",
    "chip": "india-gk",
    "description": "Great dynasties of Bharat: Mauryas, Guptas, Cholas, Marathas, Mughals, Rajputs, and Vijayanagara.",
    "descriptionHi": "मौर्य, गुप्त, चोल, मराठा, चालुक्य, राजपूत और विजयनगर साम्राज्य की वीरता और शौर्य गाथाएं।",
    "subcategories": [
      {
        "name": "Ancient Empires",
        "slug": "ancient-empires",
        "topics": [
          "Mauryan Empire & Ashoka",
          "Gupta Dynasty",
          "Harshavardhana",
          "Satavahanas"
        ]
      },
      {
        "name": "Southern Kingdoms",
        "slug": "southern-kingdoms",
        "topics": [
          "Chola Empire",
          "Pallavas & Pandyas",
          "Vijayanagara Empire",
          "Chalukyas & Rashtrakutas"
        ]
      },
      {
        "name": "Medieval Powers & Valor",
        "slug": "medieval-powers",
        "topics": [
          "Maratha Empire & Shivaji",
          "Rajput Dynasties",
          "Ahom Kingdom",
          "Sikh Empire"
        ]
      }
    ]
  },
  {
    "id": 18,
    "slug": "money-business",
    "name": "Money & Business",
    "nameHi": "व्यापार व अर्थव्यवस्था (Money & Business)",
    "icon": "💰",
    "example": "Banking, Finance, Startups, Stocks",
    "chip": "all",
    "description": "Banking concepts, monetary policy, stock markets, startups, taxation, and corporate history.",
    "descriptionHi": "बैंकिंग, शेयर बाजार, बजट, मुद्रास्फीति, जीएसटी, स्टार्टअप्स और प्रसिद्ध कंपनियां।",
    "subcategories": [
      {
        "name": "Banking & Finance",
        "slug": "banking-finance",
        "topics": [
          "RBI & Monetary Policy",
          "Types of Accounts",
          "Inflation & Repo Rate",
          "Financial Terms"
        ]
      },
      {
        "name": "Stock Market & Investments",
        "slug": "stock-market",
        "topics": [
          "NSE & BSE",
          "Mutual Funds",
          "IPO Basics",
          "Global Indices"
        ]
      },
      {
        "name": "Companies & Unicorns",
        "slug": "companies-startups",
        "topics": [
          "Indian Startups",
          "Tech Giants",
          "Famous CEOs",
          "Mergers & Acquisitions"
        ]
      }
    ]
  },
  {
    "id": 19,
    "slug": "space-universe",
    "name": "Space & Universe",
    "nameHi": "अंतरिक्ष व खगोल विज्ञान",
    "icon": "🚀",
    "example": "ISRO, NASA, Planets, Stars",
    "chip": "space",
    "description": "Planets of the solar system, galaxies, black holes, ISRO missions, NASA, and moon landings.",
    "descriptionHi": "सौरमंडल, ग्रह, तारे, ब्लैक होल, इसरो मिशन, चंद्रयान, नासा और ब्रह्मांडीय रहस्य।",
    "subcategories": [
      {
        "name": "Solar System & Planets",
        "slug": "solar-system",
        "topics": [
          "The Sun",
          "Inner Planets",
          "Gas Giants",
          "Moons of the Solar System"
        ]
      },
      {
        "name": "Deep Space & Universe",
        "slug": "deep-space",
        "topics": [
          "Galaxies & Nebulae",
          "Black Holes",
          "Stars & Supernovas",
          "Big Bang"
        ]
      },
      {
        "name": "Space Agencies & Missions",
        "slug": "space-missions",
        "topics": [
          "ISRO (Chandrayaan, Mangalyaan)",
          "NASA (Apollo, Artemis)",
          "SpaceX",
          "James Webb Telescope"
        ]
      }
    ]
  },
  {
    "id": 20,
    "slug": "brain-riddles",
    "name": "Brain Riddles",
    "nameHi": "तर्कशक्ति व पहेलियां (Brain Riddles)",
    "icon": "🧩",
    "example": "Logic, Puzzles, Riddles, IQ",
    "chip": "fun",
    "description": "Logical deduction, verbal reasoning, pattern recognition, spatial puzzles, and brain workouts.",
    "descriptionHi": "तार्किक तर्कशक्ति, कोडिंग-डिकोडिंग, दिशा ज्ञान, ब्लड रिलेशन और पहेलियां।",
    "subcategories": [
      {
        "name": "Logical Deduction",
        "slug": "logical-reasoning",
        "topics": [
          "Syllogisms",
          "Blood Relations",
          "Direction Sense",
          "Seating Arrangements"
        ]
      },
      {
        "name": "Verbal & Pattern Reasoning",
        "slug": "pattern-reasoning",
        "topics": [
          "Series Completion",
          "Coding-Decoding",
          "Analogy",
          "Odd One Out"
        ]
      },
      {
        "name": "Brain Teasers & Riddles",
        "slug": "riddles-puzzles",
        "topics": [
          "Math Puzzles",
          "Lateral Thinking",
          "Classic Riddles",
          "IQ Teasers"
        ]
      }
    ]
  },
  {
    "id": 21,
    "slug": "general-knowledge",
    "name": "General Knowledge",
    "nameHi": "सामान्य ज्ञान (Mixed GK)",
    "icon": "🧠",
    "example": "Mixed GK, Curiosity",
    "chip": "all",
    "description": "All-round trivia, miscellaneous facts, general curiosity questions, and quick quizzes.",
    "descriptionHi": "सर्वश्रेष्ठ मिश्रित सामान्य ज्ञान, महत्वपूर्ण तिथियां, संक्षिप्त नाम और रोचक तथ्य।",
    "subcategories": [
      {
        "name": "Static GK Highlights",
        "slug": "static-gk",
        "topics": [
          "First in World",
          "Largest & Smallest",
          "Important Days",
          "Headquarters"
        ]
      },
      {
        "name": "Curiosity & Trivia",
        "slug": "curiosity-trivia",
        "topics": [
          "Everyday Science Facts",
          "Human Wonders",
          "Odd & Unusual Facts"
        ]
      }
    ]
  },
  {
    "id": 22,
    "slug": "current-affairs",
    "name": "Current Affairs",
    "nameHi": "करेंट अफेयर्स",
    "icon": "📰",
    "example": "India, World, Sports",
    "chip": "all",
    "description": "Latest national and international developments, summits, sports triumphs, and honors.",
    "descriptionHi": "दैनिक समसामयिकी, राष्ट्रीय व अंतर्राष्ट्रीय घटनाक्रम, शिखर सम्मेलन और खेल जगत की ताज़ा खबरें।",
    "subcategories": [
      {
        "name": "National News",
        "slug": "national-affairs",
        "topics": [
          "Government Policies",
          "Appointments",
          "State Schemes",
          "Summits"
        ]
      },
      {
        "name": "International Affairs",
        "slug": "international-affairs",
        "topics": [
          "Global Treaties",
          "G20 & BRICS",
          "Bilateral Visits",
          "Global Conflicts"
        ]
      },
      {
        "name": "Sports & Awards Current",
        "slug": "sports-awards-ca",
        "topics": [
          "Recent Tournaments",
          "Current Honors",
          "Championship Winners"
        ]
      }
    ]
  },
  {
    "id": 23,
    "slug": "history",
    "name": "History",
    "nameHi": "विश्व इतिहास",
    "icon": "🏛️",
    "example": "Civilizations, World Wars",
    "chip": "all",
    "description": "Ancient empires, revolutions, world wars, freedom struggles, and historic milestones.",
    "descriptionHi": "प्राचीन सभ्यताएं, मध्यकालीन सल्तनतें, आधुनिक क्रांतियां और विश्व इतिहास।",
    "subcategories": [
      {
        "name": "Ancient Civilizations",
        "slug": "ancient-civ",
        "topics": [
          "Indus Valley",
          "Mesopotamia",
          "Ancient Egypt",
          "Ancient Greece & Rome"
        ]
      },
      {
        "name": "Medieval Empires",
        "slug": "medieval-empires",
        "topics": [
          "Ottoman Empire",
          "Mongol Empire",
          "Byzantine Empire",
          "Holy Roman Empire"
        ]
      },
      {
        "name": "Modern World & Revolutions",
        "slug": "modern-world",
        "topics": [
          "French Revolution",
          "Industrial Revolution",
          "World War I & II",
          "Cold War"
        ]
      }
    ]
  },
  {
    "id": 24,
    "slug": "geography",
    "name": "World Geography",
    "nameHi": "विश्व भूगोल",
    "icon": "🌎",
    "example": "Continents, Oceans, Deserts",
    "chip": "all",
    "description": "Physical geography, world mountains, deserts, straits, tectonic plates, and maps.",
    "descriptionHi": "महाद्वीप, महासागर, जलसंधियां, मरुस्थल, ज्वालामुखी और स्थलाकृतियां।",
    "subcategories": [
      {
        "name": "Physical Geography",
        "slug": "physical-geography",
        "topics": [
          "Plate Tectonics",
          "Volcanoes & Earthquakes",
          "Glaciers & Deserts",
          "Atmosphere"
        ]
      },
      {
        "name": "World Water Bodies",
        "slug": "water-bodies",
        "topics": [
          "Major Rivers of World",
          "Great Lakes",
          "Straits & Canals",
          "Ocean Trenches"
        ]
      },
      {
        "name": "World Maps & Latitudes",
        "slug": "cartography",
        "topics": [
          "Equator & Tropics",
          "Time Zones",
          "Prime Meridian",
          "Map Projections"
        ]
      }
    ]
  },
  {
    "id": 25,
    "slug": "environment-nature",
    "name": "Environment & Ecology",
    "nameHi": "पर्यावरण व पारिस्थितिकी",
    "icon": "🌿",
    "example": "Climate, Ecology, Conservation",
    "chip": "science",
    "description": "Biodiversity conservation, climate action, ecosystems, global warming, and green living.",
    "descriptionHi": "पर्यावरण संरक्षण, पारिस्थितिकी तंत्र, जलवायु परिवर्तन, प्रदूषण नियंत्रण और जैव विविधता।",
    "subcategories": [
      {
        "name": "Ecology & Ecosystems",
        "slug": "ecology",
        "topics": [
          "Food Chains",
          "Biomes",
          "Biodiversity Hotspots",
          "Ozone Layer"
        ]
      },
      {
        "name": "Climate Change & Action",
        "slug": "climate-change",
        "topics": [
          "Global Warming",
          "Paris Agreement",
          "Renewable Energy",
          "Carbon Footprint"
        ]
      },
      {
        "name": "Conservation & Sanctuaries",
        "slug": "conservation",
        "topics": [
          "Endangered Species",
          "Project Tiger",
          "Ramsar Sites",
          "Forest Acts"
        ]
      }
    ]
  },
  {
    "id": 26,
    "slug": "music",
    "name": "Music",
    "nameHi": "संगीत व वाद्य",
    "icon": "🎵",
    "example": "Bollywood, Classical, Instruments",
    "chip": "cinema",
    "description": "Indian classical ragas, legendary singers, folk rhythms, and world musical instruments.",
    "descriptionHi": "भारतीय शास्त्रीय संगीत, राग, वादक, पार्श्वगायक और अंतर्राष्ट्रीय संगीत।",
    "subcategories": [
      {
        "name": "Indian Classical Music",
        "slug": "classical-music",
        "topics": [
          "Hindustani Music",
          "Carnatic Music",
          "Ragas & Taals",
          "Gharanas"
        ]
      },
      {
        "name": "Playback Singers & Composers",
        "slug": "playback-singers",
        "topics": [
          "Lata Mangeshkar",
          "Kishore Kumar",
          "A.R. Rahman",
          "RD Burman"
        ]
      },
      {
        "name": "Musical Instruments",
        "slug": "instruments",
        "topics": [
          "String (Sitar, Sarod)",
          "Percussion (Tabla, Mridangam)",
          "Wind (Flute, Shehnai)"
        ]
      }
    ]
  },
  {
    "id": 27,
    "slug": "literature",
    "name": "Literature",
    "nameHi": "साहित्य व पुस्तकें",
    "icon": "📚",
    "example": "Books, Authors, Poetry",
    "chip": "all",
    "description": "Celebrated authors, classic novels, poetic masterpieces, epics, and literary prizes.",
    "descriptionHi": "प्रसिद्ध लेखक, कालजयी उपन्यास, कविताएं, ज्ञानपीठ पुरस्कार और विश्व साहित्य।",
    "subcategories": [
      {
        "name": "Indian Literature",
        "slug": "indian-literature",
        "topics": [
          "Hindi Sahitya (Premchand, Nirala)",
          "Tagore Works",
          "Sanskrit Classics",
          "Modern Indian Authors"
        ]
      },
      {
        "name": "World Classics",
        "slug": "world-literature",
        "topics": [
          "Shakespeare Plays",
          "Russian Classics",
          "American Literature",
          "European Novels"
        ]
      },
      {
        "name": "Literary Awards & Epics",
        "slug": "literary-awards",
        "topics": [
          "Booker Prize",
          "Nobel in Literature",
          "Jnanpith Award",
          "Great Epics"
        ]
      }
    ]
  },
  {
    "id": 28,
    "slug": "language-grammar",
    "name": "Language & Grammar",
    "nameHi": "भाषा व व्याकरण",
    "icon": "🔤",
    "example": "English, Hindi, Vocabulary",
    "chip": "all",
    "description": "Vocabulary booster, Hindi vyakaran, English grammar rules, idioms, and language roots.",
    "descriptionHi": "हिंदी व्याकरण (संधि, समास), अंग्रेजी ग्रामर, शब्दावली, मुहावरे और विश्व भाषाएं।",
    "subcategories": [
      {
        "name": "English Grammar & Vocabulary",
        "slug": "english-grammar",
        "topics": [
          "Parts of Speech",
          "Tenses & Modals",
          "Idioms & Phrases",
          "Vocabulary Builder"
        ]
      },
      {
        "name": "Hindi Vyakaran",
        "slug": "hindi-vyakaran",
        "topics": [
          "Varnamala & Sandhi",
          "Samas",
          "Muhavare & Lokoktiyan",
          "Alankar & Chhand"
        ]
      },
      {
        "name": "Linguistics & World Languages",
        "slug": "world-languages",
        "topics": [
          "Language Families",
          "Scripts & Alphabets",
          "Official Languages"
        ]
      }
    ]
  },
  {
    "id": 29,
    "slug": "mathematics",
    "name": "Mathematics",
    "nameHi": "गणित",
    "icon": "🔢",
    "example": "Arithmetic, Algebra, Geometry",
    "chip": "science",
    "description": "Mental arithmetic, speed math, algebra formulas, geometry theorems, and problem solving.",
    "descriptionHi": "अंकगणित, बीजगणित, रेखागणित, संख्या पद्धति और रोचक गणितीय पहेलियां।",
    "subcategories": [
      {
        "name": "Arithmetic Proficiency",
        "slug": "arithmetic",
        "topics": [
          "Percentages & Averages",
          "Profit & Loss",
          "Time, Speed & Distance",
          "Simple & Compound Interest"
        ]
      },
      {
        "name": "Algebra & Number Systems",
        "slug": "algebra",
        "topics": [
          "Linear Equations",
          "Quadratic Equations",
          "Divisibility Rules",
          "LCM & HCF"
        ]
      },
      {
        "name": "Geometry & Mensuration",
        "slug": "geometry-mensuration",
        "topics": [
          "Triangles & Circles",
          "Perimeter & Area",
          "Volume of 3D Solids",
          "Pythagoras Theorem"
        ]
      }
    ]
  },
  {
    "id": 30,
    "slug": "art-culture",
    "name": "Art & Culture",
    "nameHi": "कला व संस्कृति",
    "icon": "🎨",
    "example": "Paintings, Folk Art, Dances",
    "chip": "india-gk",
    "description": "Classical and folk dances, Indian painting schools, handicrafts, UNESCO intangible heritage.",
    "descriptionHi": "भारतीय शास्त्रीय नृत्य (कथक, भरतनाट्यम), लोक कलाएं (मधुबनी, वारली) और शिल्प।",
    "subcategories": [
      {
        "name": "Classical & Folk Dances",
        "slug": "dances",
        "topics": [
          "8 Classical Dances",
          "Folk Dances (Bhangra, Garba, Bihu)",
          "Tribal Dances"
        ]
      },
      {
        "name": "Paintings & Handicrafts",
        "slug": "paintings",
        "topics": [
          "Madhubani",
          "Warli Art",
          "Mughal Miniature",
          "Pattachitra",
          "Textiles"
        ]
      },
      {
        "name": "Cultural Heritage",
        "slug": "cultural-heritage",
        "topics": [
          "UNESCO Intangible List",
          "Fairs & Melas (Kumbh Mela)",
          "Festivals of India"
        ]
      }
    ]
  },
  {
    "id": 31,
    "slug": "heritage-monuments",
    "name": "Heritage & Monuments",
    "nameHi": "धरोहर व स्मारक",
    "icon": "🏰",
    "example": "Taj Mahal, Red Fort, Temples",
    "chip": "india-gk",
    "description": "Ancient temples, forts of Rajasthan, Mughal architecture, caves, and world heritage sites.",
    "descriptionHi": "ताजमहल, लाल किला, कोणार्क, एलोरा की गुफाएं, राजस्थान के दुर्ग और ऐतिहासिक धरोहरें।",
    "subcategories": [
      {
        "name": "Forts & Palaces",
        "slug": "forts-palaces",
        "topics": [
          "Rajasthan Hill Forts",
          "Red Fort",
          "Gwalior Fort",
          "Mysore Palace"
        ]
      },
      {
        "name": "Ancient Temples & Caves",
        "slug": "temples-caves",
        "topics": [
          "Ajanta & Ellora",
          "Khajuraho",
          "Konark Sun Temple",
          "Chola Temples",
          "Hampi"
        ]
      },
      {
        "name": "Mughal & Colonial Architecture",
        "slug": "mughal-colonial",
        "topics": [
          "Taj Mahal",
          "Qutub Minar",
          "Fatehpur Sikri",
          "Gateway of India",
          "Victoria Memorial"
        ]
      }
    ]
  },
  {
    "id": 32,
    "slug": "famous-people",
    "name": "Famous People",
    "nameHi": "प्रसिद्ध हस्तियां",
    "icon": "🌟",
    "example": "Leaders, Scientists, Pioneers",
    "chip": "all",
    "description": "Biographies and achievements of statesmen, visionary scientists, social reformers, and icons.",
    "descriptionHi": "महात्मा गांधी, डॉ. एपीजे अब्दुल कलाम, भगत सिंह, स्वामी विवेकानंद और विश्व विभूतियां।",
    "subcategories": [
      {
        "name": "Indian Visionaries & Reformers",
        "slug": "indian-visionaries",
        "topics": [
          "Swami Vivekananda",
          "B.R. Ambedkar",
          "Raja Ram Mohan Roy",
          "Sardar Patel"
        ]
      },
      {
        "name": "Scientists & Innovators",
        "slug": "scientists",
        "topics": [
          "A.P.J. Abdul Kalam",
          "C.V. Raman",
          "Homi Bhabha",
          "Srinivasa Ramanujan"
        ]
      },
      {
        "name": "Global Icons",
        "slug": "global-icons",
        "topics": [
          "Albert Einstein",
          "Nelson Mandela",
          "Martin Luther King Jr.",
          "Marie Curie"
        ]
      }
    ]
  },
  {
    "id": 33,
    "slug": "transport",
    "name": "Transport",
    "nameHi": "परिवहन व रेलवे",
    "icon": "🚆",
    "example": "Railways, Highways, Aviation",
    "chip": "all",
    "description": "Indian Railways network, national highways, expressways, ports, aviation, and shipping.",
    "descriptionHi": "भारतीय रेलवे, वंदे भारत, राष्ट्रीय राजमार्ग, एक्सप्रेसवे, हवाई अड्डे और प्रमुख बंदरगाह।",
    "subcategories": [
      {
        "name": "Indian Railways",
        "slug": "railways",
        "topics": [
          "Zones & Divisions",
          "Vande Bharat & Bullet Train",
          "Heritage Railways",
          "Longest Routes"
        ]
      },
      {
        "name": "Roadways & Highways",
        "slug": "roadways",
        "topics": [
          "National Highways (NH)",
          "Expressways",
          "Golden Quadrilateral",
          "Bridges & Tunnels"
        ]
      },
      {
        "name": "Aviation & Maritime",
        "slug": "aviation-maritime",
        "topics": [
          "Major Airports",
          "Air India History",
          "Major Sea Ports",
          "Inland Waterways"
        ]
      }
    ]
  },
  {
    "id": 34,
    "slug": "defence-military",
    "name": "Defence & Military",
    "nameHi": "रक्षा व सैन्य बल",
    "icon": "🛡️",
    "example": "Army, Navy, Air Force, Missiles",
    "chip": "india-gk",
    "description": "Indian Army, Navy, Air Force, missile technology, gallantry awards, and joint exercises.",
    "descriptionHi": "भारतीय थलसेना, नौसेना, वायुसेना, मिसाइल प्रणालियां (ब्रह्मोस, अग्नि) और शौर्य गाथाएं।",
    "subcategories": [
      {
        "name": "Armed Forces Wings",
        "slug": "armed-forces",
        "topics": [
          "Indian Army",
          "Indian Navy & Aircraft Carriers",
          "Indian Air Force & Fighters"
        ]
      },
      {
        "name": "Missiles & Defence Tech",
        "slug": "defence-tech",
        "topics": [
          "BrahMos & Agni",
          "DRDO Innovations",
          "Air Defence Systems",
          "Submarines"
        ]
      },
      {
        "name": "Wars, Operations & Honours",
        "slug": "wars-operations",
        "topics": [
          "1971 War",
          "Kargil Conflict",
          "Param Vir Chakra Recipients",
          "Joint Exercises"
        ]
      }
    ]
  },
  {
    "id": 35,
    "slug": "awards-achievements",
    "name": "Awards & Achievements",
    "nameHi": "पुरस्कार व सम्मान",
    "icon": "🏆",
    "example": "Bharat Ratna, Nobel, Oscars",
    "chip": "all",
    "description": "Civilian honors, Nobel prizes, Gallantry medals, Oscars, Academy awards, and sports trophies.",
    "descriptionHi": "भारत रत्न, पद्म पुरस्कार, नोबेल पुरस्कार, ऑस्कर, ज्ञानपीठ और राजीव गांधी खेल रत्न।",
    "subcategories": [
      {
        "name": "Indian Civilian & Military Awards",
        "slug": "indian-awards",
        "topics": [
          "Bharat Ratna",
          "Padma Vibhushan / Bhushan / Shri",
          "Param Vir Chakra"
        ]
      },
      {
        "name": "Global Laurels",
        "slug": "global-awards",
        "topics": [
          "Nobel Prize History",
          "Academy Awards (Oscars)",
          "Grammy Awards",
          "Pulitzer Prize"
        ]
      },
      {
        "name": "Sports & Literature Honors",
        "slug": "sports-lit-awards",
        "topics": [
          "Khel Ratna & Arjuna",
          "Dronacharya",
          "Sahitya Akademi",
          "Jnanpith Award"
        ]
      }
    ]
  },
  {
    "id": 36,
    "slug": "brands-companies",
    "name": "Brands & Companies",
    "nameHi": "कंपनियां व ब्रांड्स",
    "icon": "🏷️",
    "example": "Tata, Reliance, Apple, Google",
    "chip": "all",
    "description": "Iconic company founders, brand logos, corporate slogans, product histories, and mega-mergers.",
    "descriptionHi": "टाटा, रिलायंस, एप्पल, गूगल, माइक्रोसॉफ्ट सहित प्रमुख कंपनियों का इतिहास और लोगो।",
    "subcategories": [
      {
        "name": "Indian Conglomerates",
        "slug": "indian-companies",
        "topics": [
          "Tata Group",
          "Reliance Industries",
          "Adani Group",
          "Infosys & Wipro"
        ]
      },
      {
        "name": "Global Tech Giants",
        "slug": "global-companies",
        "topics": [
          "Apple & Microsoft",
          "Google & Alphabet",
          "Amazon & Meta",
          "Tesla"
        ]
      },
      {
        "name": "Logos & Taglines",
        "slug": "logos-taglines",
        "topics": [
          "Iconic Logos",
          "Famous Slogans",
          "Brand Mascots",
          "Founding Years"
        ]
      }
    ]
  },
  {
    "id": 37,
    "slug": "lifestyle-everyday-knowledge",
    "name": "Lifestyle & Everyday Knowledge",
    "nameHi": "दैनिक जीवन व ज्ञान",
    "icon": "☕",
    "example": "Health, Habits, Civics",
    "chip": "all",
    "description": "Daily life facts, consumer rights, traffic signs, first aid, etiquette, and domestic wisdom.",
    "descriptionHi": "दैनिक जीवन के व्यावहारिक नियम, ट्रैफिक संकेत, उपभोक्ता अधिकार और प्राथमिक उपचार।",
    "subcategories": [
      {
        "name": "Civic Sense & Rights",
        "slug": "civic-sense",
        "topics": [
          "Traffic Rules & Signs",
          "Consumer Protection Act",
          "RTI Basics",
          "Emergency Helpline Numbers"
        ]
      },
      {
        "name": "Health & Domestic Science",
        "slug": "domestic-science",
        "topics": [
          "First Aid & CPR",
          "Food Preservation",
          "Home Safety",
          "Personal Hygiene"
        ]
      }
    ]
  },
  {
    "id": 38,
    "slug": "gaming",
    "name": "Gaming",
    "nameHi": "गेमिंग व ई-स्पोर्ट्स",
    "icon": "🎮",
    "example": "Video Games, Esports, Consoles",
    "chip": "sports",
    "description": "Retro arcades, modern AAA blockbusters, esports championships, gaming consoles, and trivia.",
    "descriptionHi": "वीडियो गेम्स, प्लेस्टेशन, एक्सबॉक्स, पबजी, फ्री फायर, ई-स्पोर्ट्स और गेमिंग इतिहास।",
    "subcategories": [
      {
        "name": "Classic & Arcade Games",
        "slug": "classic-games",
        "topics": [
          "Pac-Man & Mario",
          "Tetris & Pong",
          "Pokemon",
          "Street Fighter"
        ]
      },
      {
        "name": "Modern Gaming & Esports",
        "slug": "modern-gaming",
        "topics": [
          "GTA Series",
          "Minecraft",
          "Battle Royales (BGMI, Free Fire)",
          "Esports Tournaments"
        ]
      }
    ]
  },
  {
    "id": 39,
    "slug": "plants-agriculture",
    "name": "Plants & Agriculture",
    "nameHi": "कृषि व वनस्पति",
    "icon": "🌱",
    "example": "Crops, Trees, Medicinal Plants",
    "chip": "science",
    "description": "Indian agriculture, Green Revolution, cash crops, medicinal botany, photosynthesis, and forests.",
    "descriptionHi": "भारतीय कृषि, हरित क्रांति, रबी-खरीफ फसलें, औषधीय पौधे, वनस्पति विज्ञान और मिट्टी।",
    "subcategories": [
      {
        "name": "Indian Agriculture & Crops",
        "slug": "agriculture",
        "topics": [
          "Rabi & Kharif Crops",
          "Green Revolution & M.S. Swaminathan",
          "Irrigation Systems",
          "Cash Crops"
        ]
      },
      {
        "name": "Botany & Medicinal Plants",
        "slug": "botany",
        "topics": [
          "Ayurvedic Herbs (Tulsi, Neem)",
          "Photosynthesis",
          "Carnivorous Plants",
          "Tree Longevity"
        ]
      }
    ]
  },
  {
    "id": 40,
    "slug": "inventions-discoveries",
    "name": "Inventions & Discoveries",
    "nameHi": "आविष्कार व खोजें",
    "icon": "💡",
    "example": "Electricity, Wheel, Telephone",
    "chip": "science",
    "description": "Historical breakthroughs: electricity, telephone, penicillin, printing press, steam engine.",
    "descriptionHi": "मानव इतिहास के महान आविष्कार: पहिया, बिजली, टेलीफोन, पेनिसिलिन, इंटरनेट और उनके वैज्ञानिक।",
    "subcategories": [
      {
        "name": "Era-Defining Inventions",
        "slug": "major-inventions",
        "topics": [
          "Steam Engine & Industrial Era",
          "Electricity & Light Bulb",
          "Telephone & Radio",
          "Printing Press"
        ]
      },
      {
        "name": "Medical Discoveries",
        "slug": "medical-discoveries",
        "topics": [
          "Vaccines (Smallpox, Polio)",
          "Penicillin & Antibiotics",
          "X-Rays",
          "DNA Double Helix"
        ]
      }
    ]
  },
  {
    "id": 41,
    "slug": "travel-tourism",
    "name": "Travel & Tourism",
    "nameHi": "पर्यटन व यात्रा",
    "icon": "✈️",
    "example": "Hill Stations, Beaches, Pilgrimages",
    "chip": "cities",
    "description": "Scenic hill stations of India, coastal beaches, pilgrimage circuits, and world tourist hubs.",
    "descriptionHi": "शिमला, मनाली, गोवा, केरल, चार धाम यात्रा, हिल स्टेशन और विश्व पर्यटन स्थल।",
    "subcategories": [
      {
        "name": "Indian Hill Stations & Nature",
        "slug": "hill-stations",
        "topics": [
          "Himalayan Retreats (Manali, Shimla)",
          "Western Ghats (Munnar, Ooty)",
          "Beaches of Goa & Andaman"
        ]
      },
      {
        "name": "Pilgrimage Circuits",
        "slug": "pilgrimages",
        "topics": [
          "Char Dham",
          "12 Jyotirlingas",
          "Buddhist Circuit",
          "Golden Triangle (Delhi-Agra-Jaipur)"
        ]
      }
    ]
  },
  {
    "id": 42,
    "slug": "theatre-performing-arts",
    "name": "Theatre & Performing Arts",
    "nameHi": "रंगमंच व नाट्य कला",
    "icon": "🎭",
    "example": "Nautanki, Kathakali, Drama",
    "chip": "cinema",
    "description": "Folk theatre traditions, street plays (Nukkad Natak), Sanskrit drama, and Broadway.",
    "descriptionHi": "नौटंकी, यक्षगान, जात्रा, नुक्कड़ नाटक, संस्कृत नाट्य और रंगमंच की महान विभूतियां।",
    "subcategories": [
      {
        "name": "Traditional Folk Theatre",
        "slug": "folk-theatre",
        "topics": [
          "Nautanki & Swang",
          "Yakshagana",
          "Jatra & Tamasha",
          "Koodiyattam & Kathakali"
        ]
      },
      {
        "name": "Modern Theatre & Puppetry",
        "slug": "modern-theatre",
        "topics": [
          "Nukkad Natak (Street Theatre)",
          "Kathputli & Shadow Puppetry",
          "Famous Playwrights"
        ]
      }
    ]
  },
  {
    "id": 43,
    "slug": "kids-family-quiz",
    "name": "Kids & Family Quiz",
    "nameHi": "बच्चों व परिवार का क्विज़",
    "icon": "🧸",
    "example": "Cartoons, Rhymes, Fairy Tales",
    "chip": "fun",
    "description": "Nursery rhymes, moral tales (Panchatantra), popular cartoons, superhero trivia, and child knowledge.",
    "descriptionHi": "पंचतंत्र की कहानियां, बाल कविताएं, कार्टून्स (छोटा भीम, डोरेमोन), सुपरहीरो और सरल ज्ञान।",
    "subcategories": [
      {
        "name": "Fables & Cartoons",
        "slug": "fables-cartoons",
        "topics": [
          "Panchatantra & Jataka Tales",
          "Chhota Bheem & Motu Patlu",
          "Disney & Marvel Heroes"
        ]
      },
      {
        "name": "Primary School Trivia",
        "slug": "primary-trivia",
        "topics": [
          "Colors & Shapes",
          "Animal Sounds",
          "Solar System for Kids",
          "Good Habits"
        ]
      }
    ]
  },
  {
    "id": 44,
    "slug": "fun-viral-quiz",
    "name": "Fun & Viral Quiz",
    "nameHi": "फन व वायरल क्विज़",
    "icon": "🎯",
    "example": "Memes, Pop Culture, Trends",
    "chip": "fun",
    "description": "Trending pop culture, viral internet sensations, meme trivia, and party games.",
    "descriptionHi": "इंटरनेट मीम्स, सोशल मीडिया ट्रेंड्स, वायरल फैक्ट्स और दोस्तों के साथ खेलने वाले क्विज़।",
    "subcategories": [
      {
        "name": "Meme Culture & Trends",
        "slug": "memes-trends",
        "topics": [
          "Viral Trends",
          "Internet Slang",
          "Meme Trivia",
          "Party Game Questions"
        ]
      }
    ]
  }
];

/**
 * Curated Quick Filter Chip Definitions
 */
export const QUICK_FILTER_CHIPS = [
  { id: "all", label: "All Quizzes", labelHi: "सभी क्विज़", icon: "🌐" },
  { id: "india-gk", label: "India GK", labelHi: "भारत GK", icon: "🇮🇳" },
  { id: "science", label: "Science & Tech", labelHi: "विज्ञान", icon: "🔬" },
  { id: "sports", label: "Sports", labelHi: "खेल", icon: "🏏" },
  { id: "cities", label: "Cities", labelHi: "शहर", icon: "🏙️" },
  { id: "states", label: "States", labelHi: "राज्य", icon: "🏛️" },
  { id: "cinema", label: "Cinema & Fun", labelHi: "सिनेमा", icon: "🎬" },
  { id: "space", label: "Space", labelHi: "अंतरिक्ष", icon: "🚀" },
  { id: "fun", label: "Brain & Fun", labelHi: "मजेदार", icon: "🎯" },
];

/**
 * Canonical Alias Mapping for legacy and alternate slugs
 */
export const ALIAS_MAP = {
  "sports": "india-sports",
  "sports-gk": "india-sports",
  "indian-sports": "india-sports",
  "india-sports": "india-sports",
  "politics": "india-polity",
  "politics-government": "india-polity",
  "polity": "india-polity",
  "indian-polity": "india-polity",
  "india-polity": "india-polity",
  "nature-animals": "nature-animals",
  "nature-wonders": "nature-animals",
  "animals-wildlife": "nature-animals",
  "animals-nature": "nature-animals",
  "science": "science--discovery",
  "general-science": "science--discovery",
  "science--discovery": "science--discovery",
  "ancient-medieval-indian-history": "india-history",
  "history": "india-history",
  "indian-history": "india-history",
  "india-history": "india-history",
  "indian-geography": "india-geography",
  "india-geography": "india-geography",
  "economy-others": "economy--others",
  "economy--others": "economy--others",
  "biology-gk": "biology-gk-1",
  "biology-gk-1": "biology-gk-1",
  "indian-culture": "india-culture",
  "india-culture": "india-culture",
  "others": "others",
  "space-astronomy": "space-universe",
  "space-universe": "space-universe",
  "business-economy": "money-business",
  "money-business": "money-business",
  "environment": "environment-nature",
  "environment-nature": "environment-nature",
  "reasoning-brain-games": "brain-riddles",
  "reasoning": "brain-riddles",
  "brain-riddles": "brain-riddles",
  "food-cuisine": "food",
  "food": "food",
  "indian-kingdom": "indian-kingdoms",
  "indian-kingdoms": "indian-kingdoms",
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
    "india-sports",
    "sports",
    "technology",
    "science--discovery",
    "science",
    "entertainment",
    "economy--others",
    "economy-others",
    "biology-gk-1",
    "biology-gk",
    "nature-animals",
    "nature-wonders",
    "india-culture",
    "india-polity",
    "politics-government",
    "others",
    "indian-cities",
    "indian-states-uts",
    "indian-kingdoms",
    "art-culture",
    "heritage-monuments",
    "defence-military",
    "transport",
  ],
  science: [
    "science--discovery",
    "science",
    "technology",
    "biology-gk-1",
    "human-body",
    "space-universe",
    "space-astronomy",
    "mathematics",
    "inventions-discoveries",
    "plants-agriculture",
    "environment-nature",
  ],
  sports: ["india-sports", "sports", "gaming"],
  cities: ["indian-cities", "travel-tourism"],
  states: ["indian-states-uts", "india-geography", "indian-geography"],
  cinema: ["entertainment", "music", "theatre-performing-arts"],
  space: ["space-universe", "space-astronomy", "science--discovery"],
  fun: ["brain-riddles", "reasoning-brain-games", "amazing-facts", "food", "food-cuisine", "fun-viral-quiz", "kids-family-quiz", "gaming", "others"],
};

export function filterCategoriesByChip(categories, chipId) {
  if (!chipId || chipId === "all") return categories;
  const targetSlugs = CHIP_CATEGORY_SLUGS[chipId];
  if (!targetSlugs) return categories;
  return categories.filter((c) => targetSlugs.includes(c.slug) || (ALIAS_MAP[c.slug] && targetSlugs.includes(ALIAS_MAP[c.slug])));
}
