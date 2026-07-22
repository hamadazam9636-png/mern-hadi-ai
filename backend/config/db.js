import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let cachedClient = null;
let cachedDb = null;

export async function connectDB() {
  // Agar connection pehle se cached hai toh wo return karo
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 0
      });
      await cachedClient.connect();
    }

    cachedDb = cachedClient.db(dbName || "test");

    // Background Indexing (non-blocking)
    cachedDb.collection("users").createIndex({ email: 1 }, { unique: true }).catch(() => {});
    cachedDb.collection("sessions").createIndex({ userId: 1 }).catch(() => {});
    cachedDb.collection("messages").createIndex({ sessionId: 1 }).catch(() => {});

    console.log("🚀 Native MongoDB Connected Successfully");
    return cachedDb;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}

// Safe getDB function without throwing unhandled exceptions
export function getDB() {
  return cachedDb;
}