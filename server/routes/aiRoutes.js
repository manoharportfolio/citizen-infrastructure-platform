import express from "express";

import {
  analyzeComplaint,
} from "../services/aiService.js";

const router = express.Router();

router.post(
  "/analyze-complaint",
  async (req, res) => {
    try {
      const {
        imageUrl,
        category,
        description,
        mode,
      } = req.body;

      if (!imageUrl) {
        return res.status(400).json({
          message:
            "Image URL is required.",
        });
      }

      const result =
        await analyzeComplaint({
          imageUrl,
          category: category || "",
          description:
            description || "",
          mode:
            mode || "full-check",
        });

      if (mode === "image-only") {
        return res.status(200).json({
          imageAssessment: result,
        });
      }

      return res.status(200).json({
        consistency: result,
      });

    } catch (error) {
      console.error(
        "AI route error:",
        error
      );

      // Gemini temporarily unavailable
      if (
        error.status === 503 ||
        error.code === 503
      ) {
        return res.status(503).json({
          message:
            "AI service is temporarily busy. Please try again in a moment.",
          retryable: true,
        });
      }

      return res.status(500).json({
        message:
          error.message ||
          "AI analysis failed.",
        retryable: false,
      });
    }
  }
);

export default router;