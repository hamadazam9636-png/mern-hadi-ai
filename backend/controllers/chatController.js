import { ObjectId } from "mongodb";
import Groq from "groq-sdk";
import { getDB } from "../config/db.js";
import fs from "fs";
import path from "path";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanAIResponse(text) {
  if (!text) return "";
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Clean filename helper to strip out timestamps/prefixes like "image-1784701678784-"
const getCleanFilename = (rawName) => {
  if (!rawName) return "";
  const cleanParts = rawName.split("-");
  if (cleanParts.length > 2 && !isNaN(cleanParts[1])) {
    return cleanParts.slice(2).join("-");
  }
  return rawName;
};

export async function getSessions(req, res) {
  try {
    const db = getDB();
    const sessions = await db.collection("sessions")
      .find({ userId: new ObjectId(req.user._id) })
      .sort({ updatedAt: -1 })
      .toArray();

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function createSession(req, res) {
  try {
    const { title } = req.body;
    const db = getDB();

    const newSession = {
      userId: new ObjectId(req.user._id),
      title: title || "New Workspace Chat",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("sessions").insertOne(newSession);
    res.status(201).json({ success: true, sessionId: result.insertedId, title: newSession.title });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSessionTitle(req, res) {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    const db = getDB();

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid Session ID" });
    }

    await db.collection("sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { title: title || "New Workspace Chat", updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Session title updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const db = getDB();

    const messages = await db.collection("messages")
      .find({ sessionId: new ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .toArray();

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function saveMessage(req, res) {
  try {
    const { sessionId, role, text, image, type } = req.body;
    const db = getDB();

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid Session ID" });
    }

    const session = await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) });
    if (session && (session.title === "New Workspace Chat" || session.title === "New Chat" || !session.title)) {
      if (text && text.trim()) {
        const generatedTitle = text.length > 30 ? text.substring(0, 30) + "..." : text;
        await db.collection("sessions").updateOne(
          { _id: new ObjectId(sessionId) },
          { $set: { title: generatedTitle } }
        );
      }
    }

    // Convert image path / filename to a Base64 Data URL so it displays properly in user message box
    let finalImage = image || null;
    if (finalImage && !finalImage.startsWith("data:image/")) {
      let filename = "";
      if (finalImage.includes("/uploads/")) {
        filename = finalImage.split("/uploads/")[1];
      } else {
        filename = path.basename(finalImage);
      }

      const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
      const uploadDir = isVercel ? "/tmp" : path.join(process.cwd(), "uploads");
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        try {
          const ext = path.extname(filename).toLowerCase();
          const imageBuffer = fs.readFileSync(filePath);
          const base64Image = imageBuffer.toString("base64");
          let mimeType = "image/jpeg";
          if (ext === ".png") mimeType = "image/png";
          else if (ext === ".webp") mimeType = "image/webp";
          else if (ext === ".gif") mimeType = "image/gif";

          finalImage = `data:${mimeType};base64,${base64Image}`;
        } catch (err) {
          console.error("Image base64 conversion error:", err);
        }
      }
    }

    const userMessage = {
      _id: new ObjectId(),
      sessionId: new ObjectId(sessionId),
      role: "user",
      text: text || "",
      image: finalImage,
      type: type || "chat",
      createdAt: new Date()
    };
    await db.collection("messages").insertOne(userMessage);

    const isImageRequest = type === "image_gen" || /^\/image|generate image|draw|create an image/i.test(text || "");

    let aiText = "No response generated";
    let aiGeneratedImage = null;

    if (isImageRequest) {
      const cleanPrompt = (text || "").replace(/generate image|draw|create an image|\/image/gi, "").trim();
      const promptText = cleanPrompt || "creative artwork";
      aiGeneratedImage = `https://pollinations.ai/p/${encodeURIComponent(promptText)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;
      aiText = `Here is your generated image for: "${promptText}"`;
    } else {
      let activeImage = finalImage;

      if (!activeImage) {
        const lastImageMsg = await db.collection("messages").findOne(
          { 
            sessionId: new ObjectId(sessionId), 
            image: { $ne: null } 
          },
          { sort: { createdAt: -1 } }
        );

        if (lastImageMsg && lastImageMsg.image) {
          activeImage = lastImageMsg.image;
        }
      }

      try {
        let messageContent = [];
        let isVisionModel = false;

        if (activeImage) {
          if (activeImage.startsWith("data:image/")) {
            isVisionModel = true;
            messageContent = [
              { type: "text", text: text || "Analyze this uploaded image." },
              {
                type: "image_url",
                image_url: {
                  url: activeImage
                }
              }
            ];
          } else {
            let filename = "";
            if (activeImage.includes("/uploads/")) {
              filename = activeImage.split("/uploads/")[1];
            } else {
              filename = path.basename(activeImage);
            }

            const isVercel = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
            const uploadDir = isVercel ? "/tmp" : path.join(process.cwd(), "uploads");
            const filePath = path.join(uploadDir, filename);

            if (fs.existsSync(filePath)) {
              const ext = path.extname(filename).toLowerCase();
              const isImageFile = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);

              if (isImageFile) {
                isVisionModel = true;
                const imageBuffer = fs.readFileSync(filePath);
                const base64Image = imageBuffer.toString("base64");
                const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

                messageContent = [
                  { type: "text", text: text || "Analyze this uploaded image." },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`
                    }
                  }
                ];
              } else {
                if ([".docx", ".doc", ".pdf", ".zip", ".exe", ".rar"].includes(ext)) {
                  const cleanName = getCleanFilename(filename);
                  messageContent = `The user uploaded a document file named (${cleanName}). Note: Raw binary text parsing for this format is limited, so please acknowledge this attachment and provide helpful insights based on the user's request: ${text || "Please explain this file."}`;
                } else {
                  try {
                    const fileContentText = fs.readFileSync(filePath, "utf8");
                    const cleanName = getCleanFilename(filename);
                    messageContent = `Here is the contents of the attached file (${cleanName}):\n\`\`\`\n${fileContentText}\n\`\`\`\n\nUser Question / Request: ${text || "Please analyze or explain this file."}`;
                  } catch (readErr) {
                    console.error("Text file read error:", readErr);
                    messageContent = text || "Uploaded a document file.";
                  }
                }
              }
            }
          }
        }

        if (Array.isArray(messageContent) && messageContent.length === 0) {
          messageContent = text || "Hello";
        } else if (!messageContent || (typeof messageContent === "string" && messageContent.trim() === "")) {
          messageContent = text || "Hello";
        }

        const targetModel = isVisionModel 
          ? "qwen/qwen3.6-27b" 
          : (process.env.GROQ_MODEL || "llama-3.3-70b-versatile");

        const systemInstruction = {
          role: "system",
          content: "CRITICAL: Do NOT perform hidden thinking or use <think> tags. Respond IMMEDIATELY and DIRECTLY to the user in a fully complete, professional, and well-structured format without cutting off."
        };

        const messagesPayload = [
          systemInstruction, 
          { role: "user", content: messageContent }
        ];

        const chatCompletion = await groq.chat.completions.create({
          messages: messagesPayload,
          model: targetModel,
          max_tokens: 4096,
          temperature: 0.6
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || aiText;
        aiText = cleanAIResponse(rawContent);
      } catch (groqErr) {
        console.error("Groq API Error:", groqErr.message);
        aiText = "Sorry, AI service is temporarily unavailable.";
      }
    }

    const aiMessage = {
      _id: new ObjectId(),
      sessionId: new ObjectId(sessionId),
      role: "model",
      text: aiText,
      image: aiGeneratedImage,
      type: "chat",
      createdAt: new Date()
    };
    await db.collection("messages").insertOne(aiMessage);

    await db.collection("sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { updatedAt: new Date() } }
    );

    const updatedSession = await db.collection("sessions").findOne({ _id: new ObjectId(sessionId) });

    res.status(201).json({ 
      success: true, 
      userMessage, 
      aiMessage,
      title: updatedSession?.title 
    });
  } catch (error) {
    console.error("saveMessage Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function clearSessionMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const db = getDB();

    if (!sessionId || !ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid Session ID" });
    }

    await db.collection("messages").deleteMany({ sessionId: new ObjectId(sessionId) });

    await db.collection("sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Session chat reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteSession(req, res) {
  try {
    const { sessionId } = req.params;
    const db = getDB();

    await db.collection("messages").deleteMany({ sessionId: new ObjectId(sessionId) });
    await db.collection("sessions").deleteOne({ _id: new ObjectId(sessionId) });

    res.json({ success: true, message: "Workspace tracking structural entity removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}