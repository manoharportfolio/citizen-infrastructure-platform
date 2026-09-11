import dotenv from "dotenv";

dotenv.config();

export async function sendPhoneOTP(phone, otp) {
  const mode =
    process.env.PHONE_OTP_MODE || "mock";

  if (mode === "mock") {
    console.log("--------------------------------");
    console.log("PHONE OTP - DEVELOPMENT MODE");
    console.log("Phone:", phone);
    console.log("OTP:", otp);
    console.log("Expires in: 15 minutes");
    console.log("--------------------------------");

    return true;
  }

  throw new Error(
    "Phone OTP provider is not configured."
  );
}