const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const { protect } = require("../../middleware/auth.middleware");
const {
  uploadFile,
  getFiles,
  deleteFile,
} = require("./file.controller");

// Multer — store in memory before sending to Cloudinary
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"), false);
    }
  }
});

router.use(protect);

router.post("/upload", upload.single("file"), uploadFile);
router.get("/",        getFiles);
router.delete("/:id",  deleteFile);

module.exports = router;