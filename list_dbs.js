const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/?appName=Cluster0";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const databasesList = await client.db().admin().listDatabases();
        
        console.log("Databases:");
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
