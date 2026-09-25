// server/services/imageKitService.js

import ImageKit from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();


// ============================================================
// IMAGEKIT CONFIGURATION
// ============================================================

const IMAGEKIT_PRIVATE_KEY =
  process.env.IMAGEKIT_PRIVATE_KEY;


if (!IMAGEKIT_PRIVATE_KEY) {
  throw new Error(
    "IMAGEKIT_PRIVATE_KEY is missing. Check server/.env."
  );
}


const imagekit =
  new ImageKit({
    privateKey:
      IMAGEKIT_PRIVATE_KEY,
  });


// ============================================================
// UPLOAD IMAGE
// ============================================================

export async function uploadImage(
  fileBuffer,
  fileName,
  folder = "civicai"
) {
  if (!fileBuffer) {
    throw new Error(
      "Image file buffer is required."
    );
  }


  if (!fileName) {
    throw new Error(
      "Image file name is required."
    );
  }


  try {
    const result =
      await imagekit.files.upload({
        file:
          fileBuffer.toString(
            "base64"
          ),

        fileName,

        folder,
      });


    return {
      url:
        result.url,

      fileId:
        result.fileId,

      name:
        result.name,
    };
  } catch (error) {
    console.error(
      "ImageKit upload error:",
      error
    );

    throw new Error(
      "Image upload failed."
    );
  }
}