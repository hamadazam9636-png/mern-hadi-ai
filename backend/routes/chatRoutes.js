import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { 
  getSessions, 
  createSession, 
  getMessages, 
  saveMessage, 
  clearSessionMessages,
  deleteSession 
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

router.route("/sessions")
  .get(getSessions)
  .post(createSession);

router.route("/sessions/:sessionId")
  .delete(deleteSession);

router.route("/messages")
  .post(saveMessage);

router.route("/messages/:sessionId")
  .get(getMessages)
  .delete(clearSessionMessages); 

router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No data stream transferred" });
  }
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

export default router;