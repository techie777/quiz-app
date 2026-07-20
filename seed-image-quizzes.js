const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Image Quizzes...');

  // Create Parent Category
  const parentCategory = await prisma.category.create({
    data: {
      topic: 'Image Quizzes',
      topicHi: 'चित्र क्विज़',
      slug: 'image-quizzes',
      emoji: '🖼️',
      description: 'Identify logos, famous personalities, places, and more from images!',
      descriptionHi: 'चित्रों से लोगो, प्रसिद्ध हस्तियों, स्थानों और बहुत कुछ को पहचानें!',
      categoryClass: 'image-quiz',
      showSubCategoriesOnHome: true,
      sortOrder: 10,
    }
  });

  console.log(`Created parent category: ${parentCategory.topic} (${parentCategory.id})`);

  const subCategories = [
    {
      topic: 'Famous Logos',
      topicHi: 'प्रसिद्ध लोगो',
      slug: 'famous-logos',
      emoji: '〽️',
      description: 'Can you identify these famous brand logos?',
      descriptionHi: 'क्या आप इन प्रसिद्ध ब्रांड लोगो को पहचान सकते हैं?',
    },
    {
      topic: 'Famous Personalities',
      topicHi: 'प्रसिद्ध हस्तियाँ',
      slug: 'famous-personalities',
      emoji: '👤',
      description: 'Identify famous people from history, sports, and entertainment.',
      descriptionHi: 'इतिहास, खेल और मनोरंजन की प्रसिद्ध हस्तियों को पहचानें।',
    },
    {
      topic: 'Famous Places',
      topicHi: 'प्रसिद्ध स्थान',
      slug: 'famous-places',
      emoji: '🗺️',
      description: 'Guess the famous landmarks and places around the world.',
      descriptionHi: 'दुनिया भर के प्रसिद्ध स्थलों और स्थानों का अनुमान लगाएं।',
    },
    {
      topic: 'Cars & Vehicles',
      topicHi: 'कारें और वाहन',
      slug: 'cars-vehicles',
      emoji: '🏎️',
      description: 'Identify the car brand or model from its picture.',
      descriptionHi: 'चित्र से कार के ब्रांड या मॉडल को पहचानें।',
    },
    {
      topic: 'Everyday Objects',
      topicHi: 'रोजमर्रा की वस्तुएं',
      slug: 'everyday-objects',
      emoji: '🔬',
      description: 'Can you recognize these objects zoomed in or from weird angles?',
      descriptionHi: 'क्या आप इन वस्तुओं को ज़ूम करके या अजीब कोणों से पहचान सकते हैं?',
    },
    {
      topic: 'Flags of the World',
      topicHi: 'दुनिया के झंडे',
      slug: 'world-flags',
      emoji: '🏳️‍🌈',
      description: 'Identify the country by its flag.',
      descriptionHi: 'देश को उसके झंडे से पहचानें।',
    },
    {
      topic: 'Animals & Birds',
      topicHi: 'पशु और पक्षी',
      slug: 'animals-birds',
      emoji: '🦁',
      description: 'Identify the animal or bird from the image.',
      descriptionHi: 'चित्र से जानवर या पक्षी को पहचानें।',
    },
    {
      topic: 'Movies & Web Series',
      topicHi: 'फिल्में और वेब सीरीज',
      slug: 'movies-series',
      emoji: '🎬',
      description: 'Guess the movie or web series from a single scene.',
      descriptionHi: 'एक दृश्य से फिल्म या वेब सीरीज का अनुमान लगाएं।',
    }
  ];

  let count = 0;
  for (const sub of subCategories) {
    count++;
    await prisma.category.create({
      data: {
        ...sub,
        categoryClass: 'image-quiz-sub',
        parentId: parentCategory.id,
        sortOrder: count,
      }
    });
    console.log(`Created subcategory: ${sub.topic}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
