import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let cachedClient = null;
let cachedDb = null;
let indexesCreated = false;

export async function connectDB() {
  // 1. Agar connection pehle se active hai, toh wohi return kar do (Serverless Caching)
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  try {
    // 2. Safe lazy initialization for serverless
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 0, // Serverless ke liye minPoolSize 0 rakhein taake idle connections auto-close hon
      });
      await cachedClient.connect();
    }

    cachedDb = cachedClient.db(dbName);

    // 3. Background index creation (Yeh serverless startup ko slow nahi karega)
    if (!indexesCreated) {
      indexesCreated = true;
      Promise.all([
        cachedDb.collection("users").createIndex({ email: 1 }, { unique: true }),
        cachedDb.collection("sessions").createIndex({ userId: 1 }),
        cachedDb.collection("messages").createIndex({ sessionId: 1 })
      ]).catch((err) => console.warn("Index creation warning:", err.message));
    }

    console.log("🚀 Native MongoDB Connected Successfully");
    return cachedDb;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    // NEVER use process.exit(1) on Vercel
    throw error;
  }
}

export function getDB() {
  if (!cachedDb) {
    throw new Error("Database not initialized. Ensure connectDB() is called.");
  }
  return cachedDb;
}