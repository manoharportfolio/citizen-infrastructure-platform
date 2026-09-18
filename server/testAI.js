import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model =
  process.env.GEMINI_MODEL;

try {
  console.log(
    `Testing model: ${model}`
  );

  const response =
    await ai.models.generateContent({
      model,

      contents:
        "Reply with exactly: AI_TEST_SUCCESS",
    });

  console.log("\nGemini response:");
  console.log(response.text);

} catch (error) {
  console.error(
    "\nGemini test failed:"
  );

  console.error(error);
}