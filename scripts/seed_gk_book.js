const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

async function run() {
  const url = process.env.DATABASE_URL || DEFAULT_DB_URL;
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db("quizweb");

    console.log("Connected to MongoDB successfully");

    const chaptersCol = db.collection("gk_book_chapters");
    const pagesCol = db.collection("gk_book_pages");

    const chapterDoc = {
      slug: "sindhu-ghati",
      titleHi: "सिंधु घाटी सभ्यता — विस्तार, नगर नियोजन एवं सामाजिक जीवन",
      titleEn: "Indus Valley Civilization",
      subCategory: "प्राचीन भारत का इतिहास",
      subCategorySlug: "ancient-history",
      topic: "सिंधु घाटी एवं प्रागैतिहासिक काल",
      topicSlug: "indus-and-prehistoric",
      subject: "सिंधु घाटी सभ्यता",
      subjectSlug: "indus-civilization",
      summary: "सिंधु घाटी सभ्यता का सम्पूर्ण अध्ययन: भौगोलिक विस्तार, नगर नियोजन, प्रमुख स्थल, सामाजिक-आर्थिक जीवन एवं पतन के कारण।",
      status: "published",
      sortOrder: 1,
      totalPages: 5,
      estimatedMinutes: { short: "3m", full: "8m" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await chaptersCol.updateOne(
      { slug: "sindhu-ghati" },
      { $set: chapterDoc },
      { upsert: true }
    );
    console.log("Chapter upserted: sindhu-ghati");

    const rawPages = [
      {
        pageNumber: 1,
        title: "रहस्यमयी शुरुआत",
        readingTimeShort: 3,
        readingTimeFull: 5,
        P: [
          { type: "h", text: "अनपेक्षित खोज" },
          { type: "p", text: "1856 में कराची–लाहौर रेल लाइन बिछाते समय ब्रंटन बंधुओं ने टीले की पकी ईंटें गिट्टी बना दीं, जबकि वह दुनिया की सबसे पुरानी नगर सभ्यताओं में से एक थी।" },
          { type: "l", items: [
            "1921: दयाराम साहनी, हड़प्पा की खुदाई",
            "1922: राखालदास बनर्जी, मोहनजोदड़ो ('मुर्दों का टीला')",
            "1924: सर जॉन मार्शल की औपचारिक घोषणा"
          ]},
          { type: "f", title: "परीक्षा दृष्टि", text: "सभ्यता का फैलाव मिस्र और मेसोपोटामिया के कुल क्षेत्र से कई गुना बड़ा था।" }
        ],
        F: [
          { type: "h", text: "1. पुरातात्विक पृष्ठभूमि" },
          { type: "p", text: "1826 में चार्ल्स मैसन ने पहली बार हड़प्पा के टीलों का उल्लेख किया था। 1853 और 1873 में अलेक्जेंडर कनिंघम ने भी सर्वेक्षण किया।" },
          { type: "h", text: "2. सभ्यता का समय-चक्र (Timeline)" },
          { type: "p", text: "रेडियो-कार्बन विधि (C-14) के वैज्ञानिक विश्लेषण के अनुसार:" },
          { type: "l", items: [
            "प्रारंभिक चरण (3300 – 2600 ईसा पूर्व)",
            "परिपक्व चरण (2600 – 1900 ईसा पूर्व)",
            "उत्तर/पतन चरण (1900 – 1300 ईसा पूर्व)"
          ]},
          { type: "h", text: "3. भौगोलिक सीमाएं (चारों छोर)" },
          { type: "l", items: [
            "उत्तरी सीमा: मांडा (जम्मू-कश्मीर, चिनाब नदी)",
            "दक्षिणी सीमा: दैमाबाद (महाराष्ट्र, प्रवरा नदी)",
            "पूर्वी सीमा: आलमगीरपुर (उत्तर प्रदेश, हिंडन नदी)",
            "पश्चिमी सीमा: सुत्कागेनडोर (बलूचिस्तान, दाश्त नदी)"
          ]}
        ],
        q: [
          {
            id: "q_0_0",
            text: "हड़प्पा की विधिवत खुदाई किसने करवाई?",
            options: ["दयाराम साहनी", "राखालदास बनर्जी", "जॉन मार्शल", "जॉन ब्रंटन"],
            answer: 0,
            explanation: "1921 में दयाराम साहनी ने हड़प्पा की खुदाई करवाई थी।"
          },
          {
            id: "q_0_1",
            text: "'मोहनजोदड़ो' का सिंधी अर्थ क्या है?",
            options: ["मुर्दों का टीला", "पवित्र नगर", "जल का घर", "राजा का महल"],
            answer: 0,
            explanation: "सिंधी भाषा में मोहनजोदड़ो का अर्थ 'मुर्दों का टीला' (Mound of the Dead) होता है।"
          }
        ]
      },
      {
        pageNumber: 2,
        title: "नगर योजना",
        readingTimeShort: 3,
        readingTimeFull: 6,
        P: [
          { type: "h", text: "ग्रिड प्रणाली व पकी ईंटें" },
          { type: "p", text: "सड़कें 90° पर समकोण पर काटती थीं। घरों के दरवाजे मुख्य सड़क पर न खुलकर पीछे की गलियों में खुलते थे (अपवाद: लोथल)।" },
          { type: "l", items: [
            "ढकी हुई नालियाँ व मेनहोल (सफाई व्यवस्था)",
            "ईंटों का निश्चित अनुपात: 4:2:1",
            "मोहनजोदड़ो: विशाल स्नानागार (बिटुमेन लेप)",
            "अन्नागार (Great Granary): अनाज के बड़े गोदाम"
          ]}
        ],
        F: [
          { type: "h", text: "1. ग्रिड पद्धति (Grid Pattern)" },
          { type: "p", text: "नगर शतरंज के बोर्ड की तरह बसे थे। सड़कें बिल्कुल सीधी थीं और एक-दूसरे को 90 डिग्री पर काटती थीं।" },
          { type: "h", text: "2. बेजोड़ जल-निकासी व्यवस्था" },
          { type: "p", text: "हड़प्पावासियों की जल-निकासी आज के कई आधुनिक कस्बों से भी बेहतर थी। नालियाँ पकी ईंटों और चूने-जिप्सम से पूरी तरह ढकी रहती थीं।" }
        ],
        q: [
          {
            id: "q_1_0",
            text: "किस हड़प्पा स्थल के मुख्य दरवाजे पीछे की बजाय सामने सड़क पर खुलते थे?",
            options: ["लोथल", "कालीबंगा", "हड़प्पा", "रोपड़"],
            answer: 0,
            explanation: "लोथल एकमात्र ऐसा स्थल था जहाँ दरवाजे मुख्य सड़क पर खुलते थे।"
          },
          {
            id: "q_1_1",
            text: "हड़प्पा सभ्यता में ईंटों का निश्चित अनुपात क्या था?",
            options: ["4:2:1", "3:2:1", "5:3:1", "4:3:2"],
            answer: 0,
            explanation: "हड़प्पा सभ्यता की पकी ईंटों का अनुपात 4:2:1 था।"
          }
        ]
      },
      {
        pageNumber: 3,
        title: "प्रमुख स्थल",
        readingTimeShort: 3,
        readingTimeFull: 6,
        P: [
          { type: "h", text: "महत्वपूर्ण खोजें" },
          { type: "l", items: [
            "हड़प्पा: R-37 कब्रिस्तान, अन्नागार",
            "मोहनजोदड़ो: नर्तकी की कांस्य मूर्ति, पशुपति मुहर",
            "लोथल (गुजरात): विश्व का प्राचीनतम गोदीवाड़ा (Dockyard), चावल की भूसी",
            "कालीबंगा (राजस्थान): जुते हुए खेत के साक्ष्य, अग्नि वेदियाँ",
            "धोलावीरा (गुजरात): 3 भागों में बंटा नगर, उन्नत जल संचयन (Reservoirs)"
          ]}
        ],
        F: [
          { type: "h", text: "1. हड़प्पा (पंजाब, पाकिस्तान)" },
          { type: "p", text: "रावी नदी के तट पर स्थित। यहाँ से R-37 कब्रिस्तान और मातृदेवी की मूर्तियां मिली हैं।" },
          { type: "h", text: "2. मोहनजोदड़ो (सिंध, पाकिस्तान)" },
          { type: "p", text: "सिंधु नदी के किनारे स्थित। यहाँ से विशाल स्नानागार, कांस्य नर्तकी और पुरोहित की मूर्ति मिली है।" }
        ],
        q: [
          {
            id: "q_2_0",
            text: "कांस्य की प्रसिद्ध 'नर्तकी की मूर्ति' कहाँ से मिली?",
            options: ["मोहनजोदड़ो", "हड़प्पा", "चन्हूदड़ो", "बनावली"],
            answer: 0,
            explanation: "कांस्य नर्तकी मोहनजोदड़ो से प्राप्त हुई थी।"
          },
          {
            id: "q_2_1",
            text: "प्राचीनतम ज्ञात गोदीवाड़ा (Dockyard) कहाँ खोजा गया?",
            options: ["लोथल", "सुरकोटदा", "धोलावीरा", "रंगपुर"],
            answer: 0,
            explanation: "लोथल में विश्व का प्राचीनतम गोदीवाड़ा पाया गया था।"
          }
        ]
      },
      {
        pageNumber: 4,
        title: "समाज व व्यापार",
        readingTimeShort: 3,
        readingTimeFull: 5,
        P: [
          { type: "h", text: "जीवनशैली व अर्थव्यवस्था" },
          { type: "l", items: [
            "कांस्य युगीन सभ्यता — लोहे का ज्ञान नहीं था",
            "कपास की खेती सर्वप्रथम हड़प्पावासियों ने शुरू की (यूनानी इसे 'सिंडन' कहते थे)",
            "लिपि: भावचित्रात्मक (Boustrophedon), अभी तक पढ़ी नहीं जा सकी",
            "मेसोपोटामियाई अभिलेखों में सिंधु क्षेत्र को 'मेलुहा' कहा गया",
            "माप-तोल: 16 के गुणक पर आधारित"
          ]}
        ],
        F: [
          { type: "h", text: "1. सामाजिक संरचना" },
          { type: "p", text: "मातृसत्तात्मक समाज के प्रबल संकेत। युद्ध के अस्त्र-शस्त्र बहुत कम मिले, जिससे शांतिप्रिय समाज का प्रमाण मिलता है।" }
        ],
        q: [
          {
            id: "q_3_0",
            text: "सिंधु घाटी सभ्यता के लोगों को किस धातु का ज्ञान नहीं था?",
            options: ["लोहा", "कांस्य", "तांबा", "सोना"],
            answer: 0,
            explanation: "सिंधु घाटी सभ्यता के लोग लोहे (Iron) से परिचित नहीं थे।"
          },
          {
            id: "q_3_1",
            text: "मेसोपोटामियाई अभिलेखों में सिंधु क्षेत्र के लिए किस शब्द का प्रयोग हुआ?",
            options: ["मेलुहा", "दिलमुन", "मगन", "सुमेर"],
            answer: 0,
            explanation: "मेसोपोटामियाई अभिलेखों में सिंधु क्षेत्र को 'मेलुहा' कहा गया है।"
          }
        ]
      },
      {
        pageNumber: 5,
        title: "पतन व विरासत",
        readingTimeShort: 3,
        readingTimeFull: 5,
        P: [
          { type: "h", text: "सभ्यता का अवसान" },
          { type: "p", text: "1900 ईसा पूर्व के बाद नगरीय जीवन धीरे-धीरे समाप्त हुआ।" },
          { type: "l", items: [
            "मुख्य कारण: जलवायु परिवर्तन, सूखा, सरस्वती (घग्घर) नदी का सूखना",
            "आधुनिक भारत को देन: 90° समकोण ग्रिड योजना (जैसे चंडीगढ़), स्वास्तिक चिन्ह, पशुपति/शिव पूजा, जल-संचयन मॉडल"
          ]}
        ],
        F: [
          { type: "h", text: "1. पतन के संभावित कारण" },
          { type: "p", text: "जलवायु परिवर्तन, बाढ़ और व्यापारिक पतन इसके मुख्य कारण थे।" },
          { type: "h", text: "2. आधुनिक भारत को हड़प्पा की देन" },
          { type: "l", items: [
            "नगर योजना: चंडीगढ़ का ग्रिड मॉडल",
            "धार्मिक निरंतरता: पशुपति, पीपल पूजा, स्वास्तिक"
          ]}
        ],
        q: [
          {
            id: "q_4_0",
            text: "सिंधु घाटी सभ्यता के पतन का सबसे मान्य कारण क्या माना जाता है?",
            options: ["जलवायु परिवर्तन व नदियों का सूखना", "विदेशी आक्रमण", "महामारी", "आग लगना"],
            answer: 0,
            explanation: "जलवायु परिवर्तन और नदियों का मार्ग बदलना सबसे मान्य कारण है।"
          },
          {
            id: "q_4_1",
            text: "आधुनिक भारत का कौन सा सुनियोजित शहर हड़प्पा की ग्रिड पद्धति पर बसाया गया है?",
            options: ["चंडीगढ़", "जयपुर", "गांधीनगर", "नवी मुंबई"],
            answer: 0,
            explanation: "चंडीगढ़ को हड़प्पा की समकोण 90° ग्रिड पद्धति पर बसाया गया है।"
          }
        ]
      }
    ];

    for (const p of rawPages) {
      await pagesCol.updateOne(
        { chapterSlug: "sindhu-ghati", pageNumber: p.pageNumber },
        {
          $set: {
            chapterSlug: "sindhu-ghati",
            pageNumber: p.pageNumber,
            title: p.title,
            readingTimeShort: p.readingTimeShort,
            readingTimeFull: p.readingTimeFull,
            P: p.P,
            F: p.F,
            q: p.q,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
    }
    console.log("Upserted 5 pages with self-contained quizzes into gk_book_pages");

    console.log("Seeding completed successfully!");
  } finally {
    await client.close();
  }
}

run().catch(console.error);
