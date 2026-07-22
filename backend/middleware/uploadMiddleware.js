import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, text files, and common code/document formats
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|txt|pdf|doc|docx|js|json|html|css|csv|md)$/i;
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype.startsWith("image/") || 
    file.mimetype.startsWith("text/") || 
    allowedExtensions.test(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images, text, and document formats are supported"), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit increased to 10MB safely
  fileFilter: fileFilter
});