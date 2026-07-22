import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB, connectDB } from "../config/db.js";

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "fallback_secret_key";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All input payloads are required" });
    }

    // Safely get DB connection in serverless
    let db = getDB();
    if (!db && typeof connectDB === "function") {
      const conn = await connectDB();
      db = conn.db || conn;
    }

    if (!db) {
      throw new Error("Database connection could not be established.");
    }

    const userExists = await db.collection("users").findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Identity parameter conflict" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      success: true,
      user: { id: result.insertedId, name, email },
      token: generateToken(result.insertedId)
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Safely get DB connection in serverless
    let db = getDB();
    if (!db && typeof connectDB === "function") {
      const conn = await connectDB();
      db = conn.db || conn;
    }

    if (!db) {
      throw new Error("Database connection could not be established.");
    }

    const user = await db.collection("users").findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid client credentials" });
    }
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}