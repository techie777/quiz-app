const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('quizweb');

    // 1. Seed Categories
    const categories = [
      { id: "banking", name: "Banking", icon: "🏦" },
      { id: "railway", name: "Railway", icon: "🚂" },
      { id: "defence", name: "Defence", icon: "🎖️" },
      { id: "teaching", name: "Teaching", icon: "👨‍🏫" },
      { id: "engineering", name: "Engineering", icon: "⚙️" },
      { id: "medical", name: "Medical", icon: "🏥" },
      { id: "civil", name: "Civil Services", icon: "🏛️" }
    ];

    await db.collection('examCategories').deleteMany({});
    await db.collection('examCategories').insertMany(categories);
    console.log('Categories seeded');

    // 2. Seed Govt Exams
    const exams = [
      {
        id: "sbi-po-2026",
        title: "SBI PO Recruitment 2026",
        category: "banking",
        organization: "State Bank of India",
        governmentType: "Central",
        startDate: "2026-04-01T00:00:00.000Z",
        lastDate: "2026-05-15T00:00:00.000Z",
        vacancies: 2000,
        postNames: "Probationary Officer",
        qualification: "Graduation in any discipline",
        ageLimit: "21-30 years",
        eligibility: "Indian Citizen",
        quota: { gen: 810, sc: 300, st: 150, obc: 540 },
        syllabus: "Prelims: English, Quant, Reasoning. Mains: Data Analysis, General Awareness, Reasoning, English.",
        applicationFee: "₹750 for Gen/OBC, Nil for SC/ST",
        officialWebsite: "https://sbi.co.in/careers",
        description: "Recruitment of Probationary Officers in State Bank of India."
      },
      {
        id: "rrb-ntpc-2026",
        title: "RRB NTPC Phase II",
        category: "railway",
        organization: "Railway Recruitment Board",
        governmentType: "Central",
        startDate: "2026-03-20T00:00:00.000Z",
        lastDate: "2026-04-30T00:00:00.000Z",
        vacancies: 35000,
        postNames: "Station Master, Goods Guard, Clerk",
        qualification: "12th Pass / Graduation",
        ageLimit: "18-33 years",
        eligibility: "Medical fitness as per railway norms",
        quota: { gen: 15000, sc: 5000, st: 2500, obc: 9500 },
        syllabus: "General Awareness, Mathematics, General Intelligence and Reasoning.",
        applicationFee: "₹500 (Refundable ₹400 after CBT 1)",
        officialWebsite: "https://indianrailways.gov.in",
        description: "Non-Technical Popular Categories recruitment for various zones."
      },
      {
        id: "upsc-cse-2026",
        title: "Civil Services Examination 2026",
        category: "civil",
        organization: "UPSC",
        governmentType: "Central",
        startDate: "2026-02-01T00:00:00.000Z",
        lastDate: "2026-03-05T00:00:00.000Z",
        vacancies: 1055,
        postNames: "IAS, IPS, IFS, IRS",
        qualification: "Graduate from recognized University",
        ageLimit: "21-32 years",
        eligibility: "Indian National (for IAS/IPS)",
        quota: { gen: 450, sc: 160, st: 80, obc: 280 },
        syllabus: "Prelims: GS I & CSAT. Mains: 9 Papers (Qualifying, Essay, GS I-IV, Optional I-II).",
        applicationFee: "₹100 (Exempted for Female/SC/ST/PwBD)",
        officialWebsite: "https://upsc.gov.in",
        description: "Prestigious examination for recruitment to various Civil Services of the Government of India."
      }
    ];

    await db.collection('govtExams').deleteMany({});
    await db.collection('govtExams').insertMany(exams);
    console.log('Govt Exams seeded');

    console.log('All dummy data uploaded successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.close();
  }
}

seed();
