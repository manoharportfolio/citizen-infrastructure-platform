import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();


// ============================================================
// CONFIGURATION
// ============================================================

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

const CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Footpath",
  "Streetlight",
  "Water",
  "Drainage",
  "Public Transport",
  "Other",
];


if (!GEMINI_API_KEY) {
  console.warn(
    "Warning: GEMINI_API_KEY is not configured."
  );
}


const ai =
  GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey:
          GEMINI_API_KEY,
      })
    : null;


// ============================================================
// HELPERS
// ============================================================

function cleanJsonText(
  text
) {
  if (!text) {
    return "";
  }

  let cleaned =
    String(text).trim();


  if (
    cleaned.startsWith(
      "```json"
    )
  ) {
    cleaned =
      cleaned.slice(7);
  } else if (
    cleaned.startsWith(
      "```"
    )
  ) {
    cleaned =
      cleaned.slice(3);
  }


  if (
    cleaned.endsWith(
      "```"
    )
  ) {
    cleaned =
      cleaned.slice(
        0,
        -3
      );
  }


  return cleaned.trim();
}


function parseGeminiJson(
  text
) {
  const cleaned =
    cleanJsonText(text);


  try {
    return JSON.parse(
      cleaned
    );
  } catch {
    const start =
      cleaned.indexOf("{");

    const end =
      cleaned.lastIndexOf("}");


    if (
      start !== -1 &&
      end !== -1 &&
      end > start
    ) {
      return JSON.parse(
        cleaned.slice(
          start,
          end + 1
        )
      );
    }


    throw new Error(
      "Gemini returned an invalid JSON response."
    );
  }
}


function normalizeConfidence(
  value
) {
  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {
    return 0;
  }


  if (number < 0) {
    return 0;
  }


  if (number > 100) {
    return 100;
  }


  return Math.round(
    number
  );
}


function normalizeScore(
  value
) {
  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {
    return 0;
  }


  if (number < 0) {
    return 0;
  }


  if (number > 100) {
    return 100;
  }


  return Math.round(
    number
  );
}


function normalizeCategory(
  value
) {
  const category =
    String(
      value || ""
    ).trim();


  const matched =
    CATEGORIES.find(
      (item) =>
        item.toLowerCase() ===
        category.toLowerCase()
    );


  return (
    matched ||
    "Other"
  );
}


function normalizeObservations(
  value
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }


  return value
    .map(
      (item) =>
        String(item).trim()
    )
    .filter(Boolean)
    .slice(0, 10);
}


// ============================================================
// DOWNLOAD IMAGE
// ============================================================

async function downloadImage(
  imageUrl
) {
  if (!imageUrl) {
    throw new Error(
      "Image URL is required."
    );
  }


  const response =
    await axios.get(
      imageUrl,
      {
        responseType:
          "arraybuffer",
        timeout: 30000,
      }
    );


  const contentType =
    response.headers[
      "content-type"
    ] ||
    "image/jpeg";


  const mimeType =
    contentType.split(
      ";"
    )[0];


  return {
    base64:
      Buffer.from(
        response.data
      ).toString(
        "base64"
      ),
    mimeType,
  };
}


// ============================================================
// GEMINI REQUEST
// ============================================================

async function generateGeminiResponse(
  imageUrl,
  prompt
) {
  if (!ai) {
    throw new Error(
      "Gemini AI is not configured. Add GEMINI_API_KEY to server/.env."
    );
  }


  const image =
    await downloadImage(
      imageUrl
    );


  const response =
    await ai.models.generateContent(
      {
        model:
          GEMINI_MODEL,

        contents: [
          {
            role:
              "user",

            parts: [
              {
                inlineData: {
                  mimeType:
                    image.mimeType,
                  data:
                    image.base64,
                },
              },

              {
                text:
                  prompt,
              },
            ],
          },
        ],

        config: {
          temperature:
            0.2,

          responseMimeType:
            "application/json",
        },
      }
    );


  return (
    response.text ||
    ""
  );
}


// ============================================================
// IMAGE-ONLY ANALYSIS
// ============================================================

async function analyzeImageOnly(
  imageUrl
) {
  const prompt = `
You are an AI visual inspection assistant for CivicAI, a citizen infrastructure reporting platform.

Analyze ONLY what is visually observable in the submitted image.

Do not assume that the citizen's description is true.
Do not invent details that cannot be seen.
Do not identify a person.
Do not make claims about ownership, legal responsibility, or exact location.

Your task is to identify the visible infrastructure or public issue.

Allowed categories:
${CATEGORIES.join(", ")}

Return ONLY valid JSON using exactly this structure:

{
  "detectedIssue": "short description of the issue visibly detected in the image",
  "suggestedCategory": "one category from the allowed categories",
  "confidence": 0,
  "observations": [
    "visible observation 1",
    "visible observation 2"
  ]
}

Rules:

1. detectedIssue must describe the actual visible issue.
2. suggestedCategory must be exactly one of the allowed categories.
3. confidence must be a number from 0 to 100.
4. observations must contain only visible evidence.
5. If the image is unclear, use a lower confidence.
6. If no relevant public infrastructure issue can be identified, use:
   detectedIssue: "No clear infrastructure issue detected"
   suggestedCategory: "Other"
7. Never fabricate information.
`;


  const text =
    await generateGeminiResponse(
      imageUrl,
      prompt
    );


  const result =
    parseGeminiJson(
      text
    );


  return {
    detectedIssue:
      String(
        result.detectedIssue ||
          ""
      ).trim(),

    suggestedCategory:
      normalizeCategory(
        result.suggestedCategory
      ),

    confidence:
      normalizeConfidence(
        result.confidence
      ),

    observations:
      normalizeObservations(
        result.observations
      ),
  };
}


// ============================================================
// FULL COMPLAINT CONSISTENCY CHECK
// ============================================================

async function analyzeFullComplaint(
  imageUrl,
  category,
  description
) {
  const prompt = `
You are an AI evidence consistency checker for CivicAI.

A citizen has submitted:

Reported category:
${category || "Not provided"}

Reported description:
${description || "Not provided"}

Analyze the attached image and compare the visible evidence with the citizen's report.

Important:
- The AI must NOT claim that the complaint is definitely true or false.
- The image can only provide visual evidence.
- Do not identify people.
- Do not infer hidden circumstances.
- Do not invent facts.
- Evaluate whether the visible evidence is reasonably consistent with the reported category and description.

Allowed categories:
${CATEGORIES.join(", ")}

Return ONLY valid JSON using exactly this structure:

{
  "detectedIssue": "short description of the issue visibly detected",
  "categoryMatch": true,
  "descriptionMatch": true,
  "score": 0,
  "approved": true,
  "reason": "short explanation of why the image is or is not visually consistent with the report"
}

Rules:

1. detectedIssue must come from visible evidence.
2. categoryMatch must indicate whether the visible issue appears consistent with the reported category.
3. descriptionMatch must indicate whether the visible image is reasonably consistent with the description.
4. score must be from 0 to 100.
5. approved should be true when the evidence is reasonably consistent with the report.
6. approved should be false when the image clearly conflicts with the report.
7. If the image is unclear, lower the score and explain the uncertainty.
8. Do not treat AI analysis as proof of the complaint.
`;


  const text =
    await generateGeminiResponse(
      imageUrl,
      prompt
    );


  const result =
    parseGeminiJson(
      text
    );


  const score =
    normalizeScore(
      result.score
    );


  return {
    detectedIssue:
      String(
        result.detectedIssue ||
          ""
      ).trim(),

    categoryMatch:
      Boolean(
        result.categoryMatch
      ),

    descriptionMatch:
      Boolean(
        result.descriptionMatch
      ),

    score,

    approved:
      Boolean(
        result.approved
      ),

    reason:
      String(
        result.reason ||
          ""
      ).trim(),
  };
}


// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

export async function analyzeComplaint(
  {
    imageUrl,
    category = "",
    description = "",
    mode = "full-check",
  } = {}
) {
  if (!imageUrl) {
    throw new Error(
      "Image URL is required for AI analysis."
    );
  }


  if (
    mode ===
    "image-only"
  ) {
    return await analyzeImageOnly(
      imageUrl
    );
  }


  return await analyzeFullComplaint(
    imageUrl,
    category,
    description
  );
}


// ============================================================
// EXPORT CATEGORIES
// ============================================================

export {
  CATEGORIES,
};