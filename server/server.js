import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import reportRoutes from "./routes/reportRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";

dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "CivicAI API is running.",
  });
});

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "CivicAI backend is healthy.",
    });
  }
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/images",
  imageRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/otp",
  otpRoutes
);

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error.",
    });
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  }
);