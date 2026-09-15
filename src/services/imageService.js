const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function uploadImage(file, folder) {
  const formData = new FormData();

  formData.append("image", file);
  formData.append("folder", folder);

  const response = await fetch(`${API_URL}/api/images/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed.");
  }

  return data.image;
}