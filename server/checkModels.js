import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "GEMINI_API_KEY is missing from server/.env"
  );
  process.exit(1);
}

try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Gemini API error:",
      JSON.stringify(data, null, 2)
    );
    process.exit(1);
  }

  console.log("\nAvailable Gemini models:\n");

  for (const model of data.models || []) {
    const supportsGenerate =
      model.supportedGenerationMethods?.includes(
        "generateContent"
      );

    if (supportsGenerate) {
      console.log(
        `${model.name}  |  ${model.displayName || ""}`
      );
    }
  }

  console.log("\nDone.");
} catch (error) {
  console.error(
    "Failed to check Gemini models:",
    error
  );
}