const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const ipsSlug = 'ips-indian-police-service';
  
  // Find or create career category (optional, if we want to link it)
  // we can leave careerCategoryId null for now since it's optional

  // Create or update the guide
  let guide = await prisma.careerGuide.upsert({
    where: { slug: ipsSlug },
    update: {},
    create: {
      slug: ipsSlug,
      name: "IPS (Indian Police Service)",
      nameHi: "IPS (भारतीय पुलिस सेवा)",
      category: "UPSC & Civil Services",
      description: "Indian Police Service (IPS) is one of the premier All India Services. An IPS officer is primarily responsible for maintaining public peace and order, preventing crime, and ensuring internal security.",
      descriptionHi: "भारतीय पुलिस सेवा (IPS), अखिल भारतीय सेवाओं (All India Services) के तीन मुख्य स्तंभों में से एक है। एक IPS अधिकारी का मुख्य कार्य कानून व्यवस्था बनाए रखना, अपराधों की रोकथाम और जांच करना, तथा देश की आंतरिक सुरक्षा को संभालना होता है।",
      icon: "👮",
      difficulty: "Hard",
      difficultyHi: "कठिन",
      competition: "Very High",
      competitionHi: "बहुत उच्च",
      avgSalary: "₹56,100 - ₹2,50,000",
      avgSalaryHi: "₹56,100 - ₹2,50,000",
      workType: "Field + Office",
      workTypeHi: "फील्ड + ऑफिस",
      type: "JOB"
    }
  });

  // Delete existing sections to avoid duplicates
  await prisma.careerSection.deleteMany({
    where: { careerGuideId: guide.id }
  });

  // Add new sections
  await prisma.careerSection.createMany({
    data: [
      {
        careerGuideId: guide.id,
        title: "Introduction",
        titleHi: "1. IPS क्या है? (परिचय)",
        type: "TEXT",
        content: JSON.stringify("The Indian Police Service (IPS) is one of the three main pillars of the All India Services (the other two being IAS and IFS). Its selection is done through the Civil Services Examination (CSE) conducted by UPSC."),
        contentHi: JSON.stringify("भारतीय पुलिस सेवा (IPS), अखिल भारतीय सेवाओं (All India Services) के तीन मुख्य स्तंभों में से एक है (अन्य दो IAS और IFS हैं)। एक IPS अधिकारी का मुख्य कार्य कानून व्यवस्था बनाए रखना, अपराधों की रोकथाम और जांच करना, तथा देश की आंतरिक सुरक्षा को संभालना होता है। इसका चयन संघ लोक सेवा आयोग (UPSC) द्वारा आयोजित सिविल सेवा परीक्षा (CSE) के माध्यम से होता है।"),
        sortOrder: 1
      },
      {
        careerGuideId: guide.id,
        title: "Eligibility Criteria",
        titleHi: "2. पात्रता और योग्यता (Eligibility Criteria)",
        type: "LIST",
        content: JSON.stringify([
          "Educational Qualification: Graduation Degree from any recognized university (Final year students can also apply).",
          "Nationality: Must be a citizen of India.",
          "Age Limit & Attempts: Minimum 21 years.",
          "General: Max 32 years (6 attempts)",
          "OBC: Max 35 years (9 attempts)",
          "SC/ST: Max 37 years (Unlimited attempts up to age limit)"
        ]),
        contentHi: JSON.stringify([
          "शैक्षणिक योग्यता: किसी भी मान्यता प्राप्त विश्वविद्यालय से किसी भी विषय (Arts, Science, Commerce, Engineering) में स्नातक (Graduation Degree) होना आवश्यक है। स्नातक में केवल उत्तीर्ण होना (Passing Marks) ही पर्याप्त है। स्नातक के अंतिम वर्ष (Final Year) के छात्र भी आवेदन कर सकते हैं।",
          "राष्ट्रीयता: उम्मीदवार का अनिवार्य रूप से भारत का नागरिक होना आवश्यक है।",
          "आयु सीमा और प्रयास (Age & Attempts): आयु की गणना प्रत्येक वर्ष 1 अगस्त के आधार पर की जाती है। न्यूनतम आयु 21 वर्ष होनी चाहिए:",
          "सामान्य श्रेणी (General): अधिकतम 32 वर्ष (कुल 6 प्रयास)",
          "अन्य पिछड़ा वर्ग (OBC): अधिकतम 35 वर्ष (कुल 9 प्रयास)",
          "अनुसूचित जाति/जनजाति (SC/ST): अधिकतम 37 वर्ष (आयु सीमा तक असीमित प्रयास)"
        ]),
        sortOrder: 2
      },
      {
        careerGuideId: guide.id,
        title: "Physical Standards",
        titleHi: "3. शारीरिक मानक (Physical Standards)",
        type: "TEXT",
        content: JSON.stringify("Physical standards are mandatory as IPS is a uniformed service. \nMen: Minimum height 165 cm (160 cm for SC/ST/OBC), Chest 84 cm (5 cm expansion).\nWomen: Minimum height 150 cm (145 cm for SC/ST/OBC), Chest 79 cm (5 cm expansion).\nVision: 6/6 or 6/9 for healthy eye (Spectacles/LASIK allowed)."),
        contentHi: JSON.stringify("चूँकि IPS एक वर्दीधारी पुलिस सेवा है, इसलिए इसके लिए विशेष शारीरिक मानदंडों को पूरा करना अनिवार्य होता है:\n\nन्यूनतम ऊंचाई (Height):\nपुरुष: 165 सेमी (SC/ST/OBC के लिए 160 सेमी)\nमहिला: 150 सेमी (SC/ST/OBC के लिए 145 सेमी)\n\nछाती का घेरा (Chest):\nपुरुष: 84 सेमी (न्यूनतम 5 सेमी का फैलाव अनिवार्य)\nमहिला: 79 सेमी (न्यूनतम 5 सेमी का फैलाव अनिवार्य)\n\nदृष्टि (Eyesight): स्वस्थ आँख के लिए 6/6 या 6/9; कमजोर आँख के लिए 6/12 या 6/9 (चश्मा लगाने की अनुमति है)"),
        sortOrder: 3
      },
      {
        careerGuideId: guide.id,
        title: "Exam Pattern",
        titleHi: "4. परीक्षा का प्रारूप (Exam Pattern)",
        type: "TEXT",
        content: JSON.stringify("The exam is conducted in three stages:\n1. Preliminary Exam: Objective type (General Studies-1 and CSAT).\n2. Mains Exam: 9 Descriptive papers (2 qualifying, 7 merit-based including Essay, GS I-IV, and Optional 1 & 2).\n3. Interview (Personality Test): 275 marks test evaluating mental alertness, leadership, and crisis management."),
        contentHi: JSON.stringify("यह परीक्षा तीन मुख्य चरणों में आयोजित की जाती है। अंतिम चयन (Merit List) में केवल मुख्य परीक्षा और साक्षात्कार के अंक ही जोड़े जाते हैं।\n\nचरण 1: प्रारंभिक परीक्षा (Prelims)\nयह केवल एक स्क्रीनिंग टेस्ट है। इसमें दो वस्तुनिष्ठ (MCQ) पेपर होते हैं:\n1. सामान्य अध्ययन I (200 अंक)\n2. CSAT (केवल क्वालिफाइंग - 33% अंक अनिवार्य)\n\nचरण 2: मुख्य परीक्षा (Mains Exam)\nयह एक वर्णनात्मक (Written) परीक्षा होती है, जिसमें कुल 9 पेपर होते हैं (2 क्वालिफाइंग और 7 मेरिट पेपर - कुल 1750 अंक)।\n\nचरण 3: साक्षात्कार (Interview)\nमुख्य परीक्षा उत्तीर्ण करने के बाद, उम्मीदवार का साक्षात्कार 275 अंक का होता है।"),
        sortOrder: 4
      },
      {
        careerGuideId: guide.id,
        title: "Preparation Strategy",
        titleHi: "5. तैयारी की चरणबद्ध रणनीति",
        type: "LIST",
        content: JSON.stringify([
          "Phase 1 (Months 1-3): Build a strong base by thoroughly studying NCERT books (Class 6-12) for History, Geography, Polity, and Economy.",
          "Phase 2 (Months 4-8): Read authentic standard books (e.g., Laxmikanth, Spectrum). Select and complete your Optional Subject. Read a national newspaper daily.",
          "Phase 3 (Months 9-12): Practice writing at least 2 mains answers daily. Focus entirely on Mock Tests 3-4 months prior to Prelims."
        ]),
        contentHi: JSON.stringify([
          "प्रथम चरण: आधार मजबूत करना (महीना 1-3): सबसे पहले यूपीएससी के विस्तृत पाठ्यक्रम को समझें। कक्षा 6 से 12 तक की NCERT पुस्तकों (इतिहास, भूगोल, राजनीति विज्ञान, अर्थशास्त्र) का गहन अध्ययन करें।",
          "द्वितीय चरण: प्रामाणिक पुस्तकें और वैकल्पिक विषय (महीना 4-8): मानक पुस्तकों का अध्ययन शुरू करें (जैसे लक्ष्मीकांत की राजव्यवस्था, स्पेक्ट्रम की आधुनिक इतिहास)। इसी समय अपने वैकल्पिक विषय (Optional) का चयन कर उसे पूरा पढ़ लें।",
          "तृतीय चरण: उत्तर लेखन और अभ्यास (महीना 9-12): मुख्य परीक्षा के लिए प्रतिदिन कम से कम 2 उत्तर लिखने का अभ्यास (Answer Writing) करें। प्रारंभिक परीक्षा से 3-4 महीने पहले पूरी तरह से मॉक टेस्ट पर ध्यान दें।"
        ]),
        sortOrder: 5
      },
      {
        careerGuideId: guide.id,
        title: "Training",
        titleHi: "6. प्रशिक्षण (Training)",
        type: "TEXT",
        content: JSON.stringify("Selected candidates undergo training in two phases:\n1. LBSNAA, Mussoorie: 3 months 'Foundation Course' along with all civil servants.\n2. SVPNPA, Hyderabad: 1 to 1.5 years of rigorous specialized training including law, forensics, weapon handling, horse riding, and physical fitness."),
        contentHi: JSON.stringify("अंतिम रूप से चयनित होने के बाद अधिकारियों को दो चरणों में प्रशिक्षित किया जाता है:\n\n1. लाल बहादुर शास्त्री राष्ट्रीय प्रशासनिक अकादमी (LBSNAA), मसूरी: यहाँ सभी सिविल सेवकों के साथ 3 महीने का 'फाउंडेशन कोर्स' होता है।\n2. सरदार वल्लभभाई पटेल राष्ट्रीय पुलिस अकादमी (SVPNPA), हैदराबाद: यहाँ IPS अधिकारियों को विशेष रूप से 1 से 1.5 वर्ष का कठिन प्रशिक्षण दिया जाता है। इसमें कानून, फॉरेंसिक साइंस, हथियारों का संचालन, घुड़सवारी, परेड और शारीरिक फिटनेस शामिल है।"),
        sortOrder: 6
      },
      {
        careerGuideId: guide.id,
        title: "FAQs",
        titleHi: "7. अक्सर पूछे जाने वाले प्रश्न (FAQs)",
        type: "FAQs",
        content: JSON.stringify([
          {
            q: "Are tattoos allowed in IPS?",
            a: "Generally, yes, if they are not offensive. However, large visible tattoos may face strict medical scrutiny."
          },
          {
            q: "What if a candidate doesn't meet physical standards?",
            a: "They will be disqualified from IPS but can be allocated to non-technical services like IAS or IRS based on their rank."
          },
          {
            q: "Can candidates with spectacles apply?",
            a: "Yes, candidates with spectacles or who had LASIK surgery are fully eligible provided their vision meets the 6/6 or 6/9 standard."
          },
          {
            q: "Can an IPS officer join central agencies like CBI or RAW?",
            a: "Yes, after a few years of mandatory state cadre service, IPS officers can go on Central Deputation to lead agencies like CBI, IB, RAW, and NIA."
          }
        ]),
        contentHi: JSON.stringify([
          {
            q: "क्या शरीर पर टैटू होने से IPS चयन में कोई बाधा आती है?",
            a: "सामान्यतः टैटू होने से कोई सीधी अयोग्यता नहीं होती, बशर्ते वह अश्लील, आपत्तिजनक या किसी की धार्मिक भावनाओं को आहत करने वाला न हो। अत्यधिक दिखने वाले अंगों पर बने टैटू की गहन जांच की जा सकती है।"
          },
          {
            q: "यदि कोई उम्मीदवार ऊंचाई या छाती के विस्तार के मानकों को पूरा नहीं कर पाता तो क्या होता है?",
            a: "यदि कोई उम्मीदवार चिकित्सा बोर्ड की जांच में ऊंचाई या छाती के आवश्यक फैलाव में असफल रहता है, तो उसे IPS के लिए अयोग्य घोषित कर दिया जाता है। हालाँकि, यदि उसकी रैंक अच्छी है, तो उसे गैर-तकनीकी सेवाओं (जैसे IAS या IRS) में आवंटित किया जा सकता है।"
          },
          {
            q: "क्या चश्मा लगाने वाले या लेसिक (LASIK) सर्जरी कराने वाले उम्मीदवार पात्र हैं?",
            a: "हाँ, चश्मा लगाने वाले उम्मीदवार पूरी तरह पात्र हैं, बशर्ते चश्मे के साथ उनकी दृष्टि का स्तर 6/6 या 6/9 हो। नियमों के तहत लेसिक (LASIK) सर्जरी की भी अनुमति दी जाती है।"
          },
          {
            q: "क्या आपराधिक रिकॉर्ड या लंबित FIR होने पर IPS बन सकते हैं?",
            a: "IPS बनने के लिए उम्मीदवार का रिकॉर्ड पूरी तरह साफ होना चाहिए। अंतिम चयन के बाद यदि कोई गंभीर आपराधिक मामला या दोषसिद्धि पाई जाती है, तो उम्मीदवारी रद्द की जा सकती है।"
          },
          {
            q: "UPSC परीक्षा में IPS के लिए कितनी रैंक आवश्यक है?",
            a: "सामान्य श्रेणी के लिए आमतौर पर शीर्ष 150 से 250 रैंक के भीतर आना सुरक्षित माना जाता है। आरक्षित श्रेणियों (OBC, SC, ST) के लिए यह सीमा 400 से 700 तक भी जा सकती है।"
          },
          {
            q: "क्या कोई IPS अधिकारी CBI, IB या RAW जैसी केंद्रीय एजेंसियों में जा सकता है?",
            a: "हाँ, अपने राज्य कैडर में कुछ वर्षों की अनिवार्य सेवा पूरी करने के बाद, IPS अधिकारी केंद्रीय प्रतिनियुक्ति (Central Deputation) पर जाने के पात्र होते हैं। वे CBI, IB, RAW, और NIA जैसी एजेंसियों का हिस्सा बनते हैं।"
          }
        ]),
        sortOrder: 7
      }
    ]
  });

  console.log("IPS Career Guide added successfully!");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
