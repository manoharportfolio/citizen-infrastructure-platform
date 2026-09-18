const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function analyzeComplaint({
  imageUrl,
  category,
  description,
  mode,
}) {
  const response = await fetch(
    `${API_URL}/api/ai/analyze-complaint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl,
        category,
        description,
        mode,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "AI analysis failed."
    );
  }

  return data;
}