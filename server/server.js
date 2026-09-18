import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import otpRoutes from "./routes/otpRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "Citizen Infrastructure API is running.",
  });
});

app.use(
  "/api/otp",
  otpRoutes
);

app.use(
  "/api/images",
  imageRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});