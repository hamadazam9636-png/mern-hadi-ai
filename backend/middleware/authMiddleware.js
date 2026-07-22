import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { connectDB } from "../config/db.js"; // Changed getDB to connectDB

export async function protect(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token || token === "undefined" || token === "null") {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");

      const userId = decoded.id || decoded._id || decoded.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Invalid token payload structure" });
      }

      // getDB() ki jagah await connectDB() use kiya hai taake null pointer crash na ho
      const db = await connectDB();

      let queryId;
      try {
        queryId = new ObjectId(userId);
      } catch (e) {
        queryId = userId;
      }

      const user = await db.collection("users").findOne(
        { _id: queryId },
        { projection: { password: 0 } }
      );

      if (!user) {
        return res.status(401).json({ success: false, message: "User not found or session expired" });
      }

      req.user = user;
      return next(); 

    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ success: false, message: "Unauthorized token verification failed" });
    }
  }

  return res.status(401).json({ success: false, message: "Missing authorization token" });
}