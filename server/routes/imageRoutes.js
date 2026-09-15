import express from "express";
import multer from "multer";
import { uploadImage } from "../services/imageKitService.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image provided.",
        });
      }

      const folder =
        req.body.folder || "/citizen-reports";

      const result = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        folder
      );

      return res.status(200).json({
        message: "Image uploaded successfully.",
        image: result,
      });
    } catch (error) {
      console.error(
        "Image upload route error:",
        error
      );

      return res.status(500).json({
        message: "Failed to upload image.",
      });
    }
  }
);

export default router;