const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const iasSlug = 'ias';
  
  // Find or create guide
  let guide = await prisma.careerGuide.findUnique({
    where: { slug: iasSlug }
  });

  if (!guide) {
    guide = await prisma.careerGuide.create({
      data: {
        slug: iasSlug,
        name: "IAS (Indian Administrative Service)",
        nameHi: "IAS (भारतीय प्रशासनिक सेवा)",
        category: "UPSC",
        description: "IAS is the premier administrative civil service of the Government of India. It involves leading government departments, district administration, and policy making.",
        descriptionHi: "IAS भारत सरकार की प्रमुख प्रशासनिक सिविल सेवा है। इसमें सरकारी विभागों का नेतृत्व, जिला प्रशासन और नीति निर्माण शामिल है।",
        icon: "🏛️",
        difficulty: "Very High",
        difficultyHi: "बहुत कठिन",
        competition: "Extreme",
        competitionHi: "अत्यधिक",
        avgSalary: "₹56,100 - ₹2,50,000",
        avgSalaryHi: "₹56,100 - ₹2,50,000",
        workType: "Field + Office",
        workTypeHi: "फील्ड + ऑफिस",
        type: "JOB"
      }
    });
  }

  // Delete existing sections to avoid duplicates
  await prisma.careerSection.deleteMany({
    where: { careerGuideId: guide.id }
  });

  // Add new sections based on hardcoded content
  await prisma.careerSection.createMany({
    data: [
      {
        careerGuideId: guide.id,
        title: "🎯 Why Choose IAS?",
        titleHi: "🎯 IAS क्यों चुनें?",
        type: "LIST",
        content: JSON.stringify([
          "High respect & power in society",
          "Exceptional Job security",
          "Direct impact on people's lives",
          "Good salary + perks (house, car, staff)",
          "Top-level Leadership roles"
        ]),
        contentHi: JSON.stringify([
          "समाज में उच्च सम्मान और शक्ति",
          "असाधारण नौकरी सुरक्षा",
          "लोगों के जीवन पर सीधा प्रभाव",
          "अच्छा वेतन और सुविधाएं",
          "शीर्ष स्तरीय नेतृत्व भूमिकाएं"
        ]),
        sortOrder: 1
      },
      {
        careerGuideId: guide.id,
        title: "🚫 Who Should Avoid?",
        titleHi: "🚫 किसे बचना चाहिए?",
        type: "LIST",
        content: JSON.stringify([
          "Those looking only for money",
          "Those with no patience",
          "Those who cannot do long-term continuous preparation",
          "Those who cannot handle stress or high pressure"
        ]),
        contentHi: JSON.stringify([
          "जो सिर्फ पैसा कमाने के लिए आ रहे हैं",
          "जिनके पास बिल्कुल धैर्य नहीं है",
          "जो लंबे समय तक तैयारी नहीं कर सकते",
          "जो तनाव या दबाव नहीं झेल सकते"
        ]),
        sortOrder: 2
      },
      {
        careerGuideId: guide.id,
        title: "👨‍💼 What You Will Become",
        titleHi: "👨‍💼 आप क्या बनेंगे",
        type: "LIST",
        content: JSON.stringify([
          "Top Roles: District Magistrate (DM), Collector, Policy Maker, Senior Government Administrator.",
          "Daily Work: Law & order management, implementing government schemes, solving public grievances, holding departmental meetings."
        ]),
        contentHi: JSON.stringify([
          "शीर्ष भूमिकाएं: जिला मजिस्ट्रेट (DM), कलेक्टर, नीति निर्माता, वरिष्ठ सरकारी प्रशासक।",
          "दैनिक कार्य: कानून और व्यवस्था बनाए रखना, सरकारी योजनाओं को लागू करना, जनता की समस्याओं का समाधान, विभिन्न विभागों की बैठकें लेना।"
        ]),
        sortOrder: 3
      },
      {
        careerGuideId: guide.id,
        title: "🛤️ Complete Roadmap & Time Required",
        titleHi: "🛤️ पूर्ण रोडमैप और आवश्यक समय",
        type: "LIST",
        content: JSON.stringify([
          "After 10th: Take any stream. Focus on building basics with NCERTs and read newspapers.",
          "After 12th & Graduation: Continue graduation. Start standard core subjects (Polity, History). Decide optional subject.",
          "Minimum Time: 1-2 years of highly focused study.",
          "Average Time: 3-5 years (including college base-building)."
        ]),
        contentHi: JSON.stringify([
          "10वीं के बाद: कोई भी स्ट्रीम लें। NCERTs के साथ बेसिक्स बनाएं और अखबार पढ़ें।",
          "12वीं और ग्रेजुएशन के बाद: ग्रेजुएशन जारी रखें। मुख्य विषयों की मानक किताबें शुरू करें। वैकल्पिक विषय तय करें।",
          "न्यूनतम समय: 1-2 साल गहन अध्ययन।",
          "औसत समय: 3-5 साल (कॉलेज के साथ)।"
        ]),
        sortOrder: 4
      },
      {
        careerGuideId: guide.id,
        title: "❓ Frequently Asked Questions",
        titleHi: "❓ अक्सर पूछे जाने वाले प्रश्न",
        type: "FAQS",
        content: JSON.stringify([
          { question: "What is the minimum qualification?", answer: "Graduation is required. Any stream is fine." },
          { question: "How long does it take?", answer: "Generally 2-5 years of consistent preparation." }
        ]),
        contentHi: JSON.stringify([
          { question: "IAS बनने के लिए न्यूनतम योग्यता क्या है?", answer: "ग्रेजुएशन अनिवार्य है। आप किसी भी स्ट्रीम से स्नातक हों, आप UPSC दे सकते हैं।" },
          { question: "IAS बनने में कितना समय लगता है?", answer: "आमतौर पर 2-5 साल लग सकते हैं, औसत 3-5 वर्ष।" }
        ]),
        sortOrder: 5
      }
    ]
  });

  console.log("IAS Career Guide sections added successfully!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
