import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

import { MongoClient } from "mongodb";

const DEFAULT_DB_URL =
  "mongodb+srv://admin:admin@cluster0.oz8064k.mongodb.net/quizweb?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary";

let cachedClient = null;
let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  let dbUrl = process.env.DATABASE_URL || DEFAULT_DB_URL;
  if (dbUrl.includes("readPreference=primaryPreferred")) {
    dbUrl = dbUrl.replace("readPreference=primaryPreferred", "readPreference=primary");
  } else if (!dbUrl.includes("readPreference=")) {
    dbUrl += (dbUrl.includes("?") ? "&" : "?") + "readPreference=primary";
  }

  const client = new MongoClient(dbUrl, {
    family: 4,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  cachedClient = client;
  cachedDb = client.db("quizweb");
  return cachedDb;
}
