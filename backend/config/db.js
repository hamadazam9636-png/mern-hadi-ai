import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 2
});

let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ userId: 1 });
    await db.collection("messages").createIndex({ sessionId: 1 });
    
    console.log("🚀 Native MongoDB Connected & Indexes Synchronized");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB first.");
  return db;
}