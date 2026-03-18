const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const quizzes = [
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d1", topic: "Science", emoji: "\u{1F52C}", description: "Explore the wonders of science", categoryClass: "category-science",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c1d1", difficulty: "easy", text: "What planet is known as the Red Planet?", options: ["Earth","Mars","Jupiter","Saturn"], correctAnswer: "Mars" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d2", difficulty: "easy", text: "What gas do plants absorb from the atmosphere?", options: ["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"], correctAnswer: "Carbon Dioxide" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d3", difficulty: "easy", text: "How many bones are in the adult human body?", options: ["106","206","306","186"], correctAnswer: "206" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d4", difficulty: "medium", text: "What is the chemical symbol for gold?", options: ["Go","Gd","Au","Ag"], correctAnswer: "Au" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d5", difficulty: "medium", text: "Which organ is responsible for pumping blood?", options: ["Lungs","Brain","Heart","Liver"], correctAnswer: "Heart" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d6", difficulty: "medium", text: "What is the speed of light approximately?", options: ["300,000 km/s","150,000 km/s","500,000 km/s","100,000 km/s"], correctAnswer: "300,000 km/s" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d7", difficulty: "medium", text: "What type of bond involves sharing electrons?", options: ["Ionic","Covalent","Metallic","Hydrogen"], correctAnswer: "Covalent" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d8", difficulty: "hard", text: "What particle has no electric charge in an atom?", options: ["Proton","Electron","Neutron","Photon"], correctAnswer: "Neutron" },
      { id: "65f1a2b3c4d5e6f7a8b9c1d9", difficulty: "hard", text: "What is the powerhouse of the cell?", options: ["Nucleus","Ribosome","Mitochondria","Golgi Body"], correctAnswer: "Mitochondria" },
      { id: "65f1a2b3c4d5e6f7a8b9c1e1", difficulty: "hard", text: "What element has the atomic number 79?", options: ["Silver","Gold","Platinum","Copper"], correctAnswer: "Gold" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d2", topic: "Math", emoji: "\u{1F9EE}", description: "Challenge your number skills", categoryClass: "category-math",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c2d1", difficulty: "easy", text: "What is 15 + 27?", options: ["32","42","52","41"], correctAnswer: "42" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d2", difficulty: "easy", text: "What is the square root of 144?", options: ["10","11","12","14"], correctAnswer: "12" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d3", difficulty: "easy", text: "How many sides does a hexagon have?", options: ["5","6","7","8"], correctAnswer: "6" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d4", difficulty: "medium", text: "What is 17 \u00d7 13?", options: ["201","211","221","231"], correctAnswer: "221" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d5", difficulty: "medium", text: "What is the value of \u03c0 to two decimal places?", options: ["3.12","3.14","3.16","3.18"], correctAnswer: "3.14" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d6", difficulty: "medium", text: "What is 2 to the power of 10?", options: ["512","1024","2048","256"], correctAnswer: "1024" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d7", difficulty: "medium", text: "What is the next prime number after 7?", options: ["9","10","11","13"], correctAnswer: "11" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d8", difficulty: "hard", text: "What is the derivative of x\u00b2?", options: ["x","2x","x\u00b2","2"], correctAnswer: "2x" },
      { id: "65f1a2b3c4d5e6f7a8b9c2d9", difficulty: "hard", text: "What is the sum of interior angles of a pentagon?", options: ["360\u00b0","480\u00b0","540\u00b0","720\u00b0"], correctAnswer: "540\u00b0" },
      { id: "65f1a2b3c4d5e6f7a8b9c2e1", difficulty: "hard", text: "What is log\u2081\u2080(1000)?", options: ["2","3","4","10"], correctAnswer: "3" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d3", topic: "History", emoji: "\u{1F3DB}\uFE0F", description: "Journey through time", categoryClass: "category-history",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c3d1", difficulty: "easy", text: "Who was the first President of the United States?", options: ["Abraham Lincoln","George Washington","Thomas Jefferson","John Adams"], correctAnswer: "George Washington" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d2", difficulty: "easy", text: "In which year did World War II end?", options: ["1943","1944","1945","1946"], correctAnswer: "1945" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d3", difficulty: "easy", text: "What ancient wonder was located in Egypt?", options: ["Colosseum","Great Pyramid of Giza","Hanging Gardens","Lighthouse of Alexandria"], correctAnswer: "Great Pyramid of Giza" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d4", difficulty: "medium", text: "Who discovered America in 1492?", options: ["Vasco da Gama","Ferdinand Magellan","Christopher Columbus","Amerigo Vespucci"], correctAnswer: "Christopher Columbus" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d5", difficulty: "medium", text: "What empire was ruled by Julius Caesar?", options: ["Greek","Persian","Roman","Ottoman"], correctAnswer: "Roman" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d6", difficulty: "medium", text: "The French Revolution began in which year?", options: ["1776","1789","1799","1804"], correctAnswer: "1789" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d7", difficulty: "medium", text: "Who painted the Mona Lisa?", options: ["Michelangelo","Raphael","Leonardo da Vinci","Donatello"], correctAnswer: "Leonardo da Vinci" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d8", difficulty: "hard", text: "What treaty ended World War I?", options: ["Treaty of Paris","Treaty of Versailles","Treaty of Ghent","Treaty of Vienna"], correctAnswer: "Treaty of Versailles" },
      { id: "65f1a2b3c4d5e6f7a8b9c3d9", difficulty: "hard", text: "Which civilization built Machu Picchu?", options: ["Aztec","Maya","Inca","Olmec"], correctAnswer: "Inca" },
      { id: "65f1a2b3c4d5e6f7a8b9c3e1", difficulty: "hard", text: "In what year was the Berlin Wall torn down?", options: ["1987","1988","1989","1990"], correctAnswer: "1989" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d4", topic: "Sports", emoji: "\u26BD", description: "Test your sports knowledge", categoryClass: "category-sports",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c4d1", difficulty: "easy", text: "How many players are on a soccer team?", options: ["9","10","11","12"], correctAnswer: "11" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d2", difficulty: "easy", text: "In which sport is a slam dunk performed?", options: ["Tennis","Basketball","Volleyball","Baseball"], correctAnswer: "Basketball" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d3", difficulty: "easy", text: "How many rings are on the Olympic flag?", options: ["4","5","6","7"], correctAnswer: "5" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d4", difficulty: "medium", text: "Which country won the 2018 FIFA World Cup?", options: ["Brazil","Germany","France","Argentina"], correctAnswer: "France" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d5", difficulty: "medium", text: "In tennis, what is a score of zero called?", options: ["Nil","Zero","Love","Blank"], correctAnswer: "Love" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d6", difficulty: "medium", text: "How long is a marathon in miles (approximately)?", options: ["20.2","24.2","26.2","28.2"], correctAnswer: "26.2" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d7", difficulty: "medium", text: "Which sport uses a shuttlecock?", options: ["Tennis","Badminton","Squash","Table Tennis"], correctAnswer: "Badminton" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d8", difficulty: "hard", text: "What is the diameter of a basketball hoop in inches?", options: ["16","18","20","22"], correctAnswer: "18" },
      { id: "65f1a2b3c4d5e6f7a8b9c4d9", difficulty: "hard", text: "In cricket, how many runs is a maximum hit worth?", options: ["4","5","6","8"], correctAnswer: "6" },
      { id: "65f1a2b3c4d5e6f7a8b9c4e1", difficulty: "hard", text: "Which boxer was known as 'The Greatest'?", options: ["Mike Tyson","Muhammad Ali","Floyd Mayweather","Joe Frazier"], correctAnswer: "Muhammad Ali" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d5", topic: "General Knowledge", emoji: "\u{1F4A1}", description: "A little bit of everything", categoryClass: "category-general",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c5d1", difficulty: "easy", text: "What is the largest ocean on Earth?", options: ["Atlantic","Indian","Arctic","Pacific"], correctAnswer: "Pacific" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d2", difficulty: "easy", text: "How many continents are there?", options: ["5","6","7","8"], correctAnswer: "7" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d3", difficulty: "easy", text: "What is the hardest natural substance?", options: ["Gold","Iron","Diamond","Platinum"], correctAnswer: "Diamond" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d4", difficulty: "medium", text: "What is the smallest country in the world?", options: ["Monaco","Vatican City","San Marino","Liechtenstein"], correctAnswer: "Vatican City" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d5", difficulty: "medium", text: "Which language has the most native speakers?", options: ["English","Hindi","Spanish","Mandarin Chinese"], correctAnswer: "Mandarin Chinese" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d6", difficulty: "medium", text: "What is the currency of Japan?", options: ["Yuan","Won","Yen","Ringgit"], correctAnswer: "Yen" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d7", difficulty: "medium", text: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens","William Shakespeare","Jane Austen","Mark Twain"], correctAnswer: "William Shakespeare" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d8", difficulty: "hard", text: "What is the full form of NASA?", options: ["National Aeronautics and Space Administration","National Aeronautics and Science Agency","North American Space Administration","National Aerospace and Space Agency"], correctAnswer: "National Aeronautics and Space Administration" },
      { id: "65f1a2b3c4d5e6f7a8b9c5d9", difficulty: "hard", text: "How many time zones does Russia span?", options: ["9","10","11","12"], correctAnswer: "11" },
      { id: "65f1a2b3c4d5e6f7a8b9c5e1", difficulty: "hard", text: "What is the rarest blood type?", options: ["O-","A-","B-","AB-"], correctAnswer: "AB-" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d6", topic: "Geography", emoji: "\u{1F30D}", description: "Discover the world around you", categoryClass: "category-geography",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c6d1", difficulty: "easy", text: "What is the capital of France?", options: ["London","Berlin","Paris","Madrid"], correctAnswer: "Paris" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d2", difficulty: "easy", text: "Which is the longest river in the world?", options: ["Amazon","Nile","Mississippi","Yangtze"], correctAnswer: "Nile" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d3", difficulty: "easy", text: "What is the largest continent?", options: ["Africa","Europe","North America","Asia"], correctAnswer: "Asia" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d4", difficulty: "medium", text: "Which desert is the largest in the world?", options: ["Gobi","Kalahari","Sahara","Antarctic"], correctAnswer: "Sahara" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d5", difficulty: "medium", text: "What country has the most islands?", options: ["Indonesia","Philippines","Sweden","Norway"], correctAnswer: "Sweden" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d6", difficulty: "medium", text: "Mount Everest is located in which mountain range?", options: ["Andes","Alps","Rockies","Himalayas"], correctAnswer: "Himalayas" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d7", difficulty: "medium", text: "What is the capital of Australia?", options: ["Sydney","Melbourne","Canberra","Brisbane"], correctAnswer: "Canberra" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d8", difficulty: "hard", text: "Which country has the longest coastline?", options: ["Australia","Russia","Indonesia","Canada"], correctAnswer: "Canada" },
      { id: "65f1a2b3c4d5e6f7a8b9c6d9", difficulty: "hard", text: "What is the deepest point in the ocean?", options: ["Puerto Rico Trench","Mariana Trench","Java Trench","Tonga Trench"], correctAnswer: "Mariana Trench" },
      { id: "65f1a2b3c4d5e6f7a8b9c6e1", difficulty: "hard", text: "Which African country was formerly known as Abyssinia?", options: ["Kenya","Somalia","Ethiopia","Sudan"], correctAnswer: "Ethiopia" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d7", topic: "Movies", emoji: "\u{1F3A5}", description: "Test your movie knowledge", categoryClass: "category-movies",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c7d1", difficulty: "easy", text: "Who directed the movie Jaws?", options: ["George Lucas","Steven Spielberg","Martin Scorsese","Alfred Hitchcock"], correctAnswer: "Steven Spielberg" },
      { id: "65f1a2b3c4d5e6f7a8b9c7d2", difficulty: "easy", text: "Which movie features the character Harry Potter?", options: ["The Hobbit","The Chronicles of Narnia","Harry Potter and the Sorcerer's Stone","Percy Jackson & the Olympians"], correctAnswer: "Harry Potter and the Sorcerer's Stone" },
    ],
  },
  {
    id: "65f1a2b3c4d5e6f7a8b9c0d8", topic: "Music", emoji: "\u{1F3B5}", description: "Test your music knowledge", categoryClass: "category-music",
    questions: [
      { id: "65f1a2b3c4d5e6f7a8b9c8d1", difficulty: "easy", text: "Who is known as the 'King of Pop'?", options: ["Elvis Presley","Michael Jackson","Stevie Wonder","James Brown"], correctAnswer: "Michael Jackson" },
      { id: "65f1a2b3c4d5e6f7a8b9c8d2", difficulty: "easy", text: "Which band released the album 'Abbey Road'?", options: ["The Rolling Stones","The Beatles","Led Zeppelin","Queen"], correctAnswer: "The Beatles" },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  for (let i = 0; i < quizzes.length; i++) {
    const cat = quizzes[i];
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: {
        id: cat.id,
        topic: cat.topic,
        emoji: cat.emoji,
        description: cat.description,
        categoryClass: cat.categoryClass,
        sortOrder: i,
      },
    });
    for (const q of cat.questions) {
      await prisma.question.upsert({
        where: { id: q.id },
        update: {},
        create: {
          id: q.id,
          text: q.text,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          categoryId: cat.id,
        },
      });
    }
  }
  console.log("  Categories & questions seeded.");

  const hash = await bcrypt.hash("admin", 10);
  await prisma.adminAccount.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: hash,
      displayName: "Master Admin",
      role: "master",
      status: "active",
    },
  });
  console.log("  Master Admin seeded (admin/admin).");

  const defaults = {
    difficultyEnabled: "false",
    companyName: "QuizWeb",
    companyWebsite: "https://quizweb.com",
    footerEnabled: "true",
    footerBrandDesc:
      "The ultimate platform to test your knowledge across hundreds of categories. Challenge yourself, learn new things, and have fun!",
    footerBottomText:
      "All rights reserved. Designed for knowledge seekers worldwide.",
    footerSections: JSON.stringify([
      {
        id: "platform",
        heading: "Platform",
        links: [{ id: "home", label: "Quizzes", href: "/" }],
      },
      {
        id: "company",
        heading: "Company",
        links: [{ id: "about", label: "About Us", href: "/about" }],
      },
      {
        id: "legal",
        heading: "Legal",
        links: [
          { id: "terms", label: "Terms of Usage", href: "/terms" },
          { id: "privacy", label: "Privacy Policy", href: "/privacy" },
          { id: "copyright", label: "Copyright", href: "/copyright" },
        ],
      },
    ]),
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("  Settings seeded.");
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
