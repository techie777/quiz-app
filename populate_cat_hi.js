const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapping = {
    "Biology GK": "जीव विज्ञान",
    "Bollywood GK": "बॉलीवुड",
    "Chemistry GK": "रसायन विज्ञान",
    "Computer GK": "कंप्यूटर",
    "Economy GK": "अर्थव्यवस्था",
    "History GK": "इतिहास",
    "Geography GK": "भूगोल",
    "Physics GK": "भौतिक विज्ञान",
    "Indian Polity": "भारतीय राजव्यवस्था",
    "Sports GK": "खेलकूद",
    "General Knowledge": "सामान्य ज्ञान",
    "Indian History": "भारतीय इतिहास",
    "World Geography": "विश्व भूगोल",
    "Current Affairs": "समसामयिकी",
    "India GK": "भारत सामान्य ज्ञान",
    "Indian kingdom GK": "भारतीय साम्राज्य",
    "Important days GK": "महत्वपूर्ण दिवस",
    "Agriculture GK": "कृषि सामान्य ज्ञान",
    "Environment GK": "पर्यावरण",
    "Space GK": "अंतरिक्ष विज्ञान"
};

async function run() {
    const categories = await prisma.category.findMany();
    for (const cat of categories) {
        const hindiName = mapping[cat.topic];
        if (hindiName && !cat.topicHi) {
            console.log(`Updating ${cat.topic} -> ${hindiName}`);
            await prisma.category.update({
                where: { id: cat.id },
                data: { topicHi: hindiName }
            });
        }
    }
    console.log('Finished updating categories');
}

run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
