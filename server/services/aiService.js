import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL;

const ALLOWED_CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Footpath",
  "Streetlight",
  "Water",
  "Drainage",
  "Public Transport",
  "Other",
];

function normalizeCategory(category) {
  if (!category) {
    return "Other";
  }

  const value = category.toLowerCase().trim();

  // Road-related responses
  if (
    value.includes("road") ||
    value.includes("pothole") ||
    value.includes("roads & footpaths") ||
    value.includes("road & footpath")
  ) {
    return "Road Damage";
  }

  // Footpath-related responses
  if (
    value.includes("footpath") ||
    value.includes("sidewalk") ||
    value.includes("pavement")
  ) {
    return "Footpath";
  }

  if (
    value.includes("garbage") ||
    value.includes("waste") ||
    value.includes("trash") ||
    value.includes("litter")
  ) {
    return "Garbage";
  }

  if (
    value.includes("streetlight") ||
    value.includes("street light") ||
    value.includes("lamp")
  ) {
    return "Streetlight";
  }

  if (
    value.includes("water") ||
    value.includes("water supply") ||
    value.includes("water shortage")
  ) {
    return "Water";
  }

  if (
    value.includes("drain") ||
    value.includes("drainage") ||
    value.includes("sewage")
  ) {
    return "Drainage";
  }

  if (
    value.includes("transport") ||
    value.includes("bus") ||
    value.includes("public transit")
  ) {
    return "Public Transport";
  }

  return "Other";
}

async function generateWithRetry(request, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      lastError = error;

      const status = error?.status || error?.code;

      console.error(
        `Gemini attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      if (status !== 503 && status !== 429) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const delay = 2000 * (attempt + 1);

      console.log(`Retrying Gemini in ${delay}ms...`);

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw lastError;
}

export async function analyzeComplaint({
  imageUrl,
  category,
  description,
  mode,
}) {
  if (!imageUrl) {
    throw new Error(
      "Image URL is required for AI analysis."
    );
  }

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      "Unable to retrieve evidence image."
    );
  }

  const imageBuffer =
    await imageResponse.arrayBuffer();

  const base64Image =
    Buffer.from(imageBuffer).toString("base64");

  const mimeType =
    imageResponse.headers.get("content-type") ||
    "image/jpeg";

  let prompt;

  /*
   * --------------------------------------------------
   * IMAGE-ONLY ANALYSIS
   * --------------------------------------------------
   */

  if (mode === "image-only") {
    prompt = `
You are an AI visual evidence analyzer for a citizen infrastructure reporting platform.

Analyze the uploaded image carefully.

Your task is to identify whether a visible public infrastructure issue exists.

You MUST select exactly ONE category from this list:

- Road Damage
- Garbage
- Footpath
- Streetlight
- Water
- Drainage
- Public Transport
- Other

Important category rules:

- Potholes, damaged roads, broken asphalt, road cracks,
  craters or severe road degradation -> Road Damage
- Broken sidewalks, damaged pedestrian paths or footpaths
  -> Footpath
- Garbage, waste, litter or trash -> Garbage
- Broken/non-working street lamps -> Streetlight
- Water shortage, leakage or visible water infrastructure
  problems -> Water
- Drain/sewer problems -> Drainage
- Bus/public transport infrastructure problems -> Public Transport
- If the issue cannot reasonably be classified -> Other

Do not use alternative category names such as:
"Roads & Footpaths"
"Road & Footpath"
"Transportation"
"Waste Management"

Use ONLY the exact category names listed above.

Do not claim absolute certainty.

Return ONLY valid JSON:

{
  "detectedIssue": "string",
  "suggestedCategory": "Road Damage",
  "confidence": 0,
  "observations": [
    "string"
  ]
}

confidence must be a number from 0 to 100.
`;

  } else {

    /*
     * --------------------------------------------------
     * FULL COMPLAINT CONSISTENCY CHECK
     * --------------------------------------------------
     */

    prompt = `
You are an AI evidence consistency analyzer for a citizen infrastructure reporting platform.

Analyze the uploaded image and compare it with the citizen's submitted information.

Citizen category:
${category}

Citizen description:
${description}

The application uses ONLY these categories:

- Road Damage
- Garbage
- Footpath
- Streetlight
- Water
- Drainage
- Public Transport
- Other

Determine whether the visible evidence appears reasonably consistent with the citizen's category and description.

IMPORTANT:

- Do not claim that the citizen is lying.
- Do not claim absolute certainty.
- Only use information actually visible in the image.
- Do not invent details.
- If the image is unclear, use approved=false.
- If the category clearly does not match the visible issue, use approved=false.
- A reasonable category match does not mean the complaint is proven true.

Category matching examples:

Potholes / damaged asphalt:
Road Damage

Broken sidewalk / pedestrian path:
Footpath

Garbage / trash / litter:
Garbage

Broken street lamp:
Streetlight

Water-related visible infrastructure issue:
Water

Drain / sewage issue:
Drainage

Bus / public transport infrastructure:
Public Transport

Anything else:
Other

Return ONLY valid JSON:

{
  "detectedIssue": "string",
  "categoryMatch": true,
  "descriptionMatch": true,
  "score": 0,
  "approved": true,
  "reason": "string"
}

Rules:

1. score must be between 0 and 100.

2. categoryMatch should be true when the visible issue
   appears reasonably consistent with the selected category.

3. descriptionMatch should be true when the description
   is reasonably consistent with what can be observed.

4. approved should only be true when the evidence appears
   sufficiently consistent.

5. If the image is unclear, approved=false.

6. If the category is clearly inconsistent with the image,
   approved=false.

7. Do not invent things that cannot be observed.

8. Do not treat the AI result as proof that the complaint
   is factually true.
`;
  }

  const response = await generateWithRetry({
    model: MODEL,

    contents: [
      {
        role: "user",

        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },

          {
            text: prompt,
          },
        ],
      },
    ],

    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  try {
    const result = JSON.parse(text);

    /*
     * Normalize AI category output.
     * This protects the frontend even if Gemini
     * returns something like "Roads & Footpaths".
     */

    if (result.suggestedCategory) {
      result.suggestedCategory =
        normalizeCategory(
          result.suggestedCategory
        );
    }

    /*
     * Normalize detected issue if necessary.
     */

    if (result.categoryMatch !== undefined) {
      result.categoryMatch =
        Boolean(result.categoryMatch);
    }

    if (result.descriptionMatch !== undefined) {
      result.descriptionMatch =
        Boolean(result.descriptionMatch);
    }

    if (result.score !== undefined) {
      result.score = Math.max(
        0,
        Math.min(100, Number(result.score))
      );
    }

    return result;

  } catch (error) {
    console.error(
      "AI JSON parsing error:",
      error
    );

    throw new Error(
      "AI returned an invalid response."
    );
  }
}