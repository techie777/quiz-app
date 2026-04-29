const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

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
    "Important days GK": "महत्वपूर्ण दिवस"
};

async function run() {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    const db = client.db();
    const collection = db.collection('Category');
    
    for (const [en, hi] of Object.entries(mapping)) {
        console.log(`Updating ${en} -> ${hi}`);
        await collection.updateMany(
            { topic: en },
            { $set: { topicHi: hi } }
        );
    }
    
    console.log('Finished updating categories');
    await client.close();
}

run().catch(console.error);
