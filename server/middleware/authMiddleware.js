import { adminAuth } from "../services/firebaseAdmin.js";

export async function requireAuth(
  req,
  res,
  next
) {
  try {
    const authHeader =
      req.headers.authorization || "";

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const idToken =
      authHeader.substring(7);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing.",
      });
    }

    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken
      );

    req.user = decodedToken;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
    });
  }
}