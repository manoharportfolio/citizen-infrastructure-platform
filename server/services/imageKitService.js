import ImageKit from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();

console.log("ImageKit credentials:");
console.log(
  "Public key loaded:",
  !!process.env.IMAGEKIT_PUBLIC_KEY
);
console.log(
  "Private key loaded:",
  !!process.env.IMAGEKIT_PRIVATE_KEY
);
console.log(
  "Private key length:",
  process.env.IMAGEKIT_PRIVATE_KEY?.length
);
console.log(
  "URL endpoint:",
  process.env.IMAGEKIT_URL_ENDPOINT
);

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export async function uploadImage(
  fileBuffer,
  fileName,
  folder
) {
  try {
    const result = await imagekit.files.upload({
      file: fileBuffer.toString("base64"),
      fileName,
      folder,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    };
  } catch (error) {
    console.error(
      "ImageKit upload error:",
      error
    );

    throw new Error("Image upload failed.");
  }
}