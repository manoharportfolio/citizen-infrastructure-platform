import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model =
  process.env.GEMINI_MODEL;

// Put a test image named test.jpg
// inside the server folder.
const imagePath = "./test.jpg";

if (!fs.existsSync(imagePath)) {
  console.error(
    "test.jpg was not found in the server folder."
  );

  process.exit(1);
}

try {
  const imageBuffer =
    fs.readFileSync(imagePath);

  const base64Image =
    imageBuffer.toString("base64");

  const response =
    await ai.models.generateContent({
      model,

      contents: [
        {
          role: "user",

          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },

            {
              text: `
Analyze this image as evidence for a
citizen infrastructure reporting system.

Identify:

1. What issue is visible?
2. Which infrastructure category does it belong to?
3. How confident are you from 0-100?
4. Briefly explain what you can actually observe.

Return JSON only:

{
  "detectedIssue": "",
  "suggestedCategory": "",
  "confidence": 0,
  "observations": []
}
`,
            },
          ],
        },
      ],

      config: {
        responseMimeType:
          "application/json",
      },
    });

  console.log(
    "\nVision response:"
  );

  console.log(
    response.text
  );

} catch (error) {
  console.error(
    "\nVision test failed:"
  );

  console.error(error);
}