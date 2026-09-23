import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EMAILJS_URL =
  "https://api.emailjs.com/api/v1.0/email/send";

export async function sendEmailOTP(email, otp) {
  const serviceId =
    process.env.EMAILJS_SERVICE_ID;

  const templateId =
    process.env.EMAILJS_TEMPLATE_ID;

  const publicKey =
    process.env.EMAILJS_PUBLIC_KEY;

  const privateKey =
    process.env.EMAILJS_PRIVATE_KEY;

  if (
    !serviceId ||
    !templateId ||
    !publicKey ||
    !privateKey
  ) {
    throw new Error(
      "EmailJS configuration is missing. Check server/.env."
    );
  }

  try {
    const response = await axios.post(
      EMAILJS_URL,
      {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,

        template_params: {
          to_email: email,
          otp,
          expiry_minutes: 15,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    const status =
      error.response?.status;

    const message =
      error.response?.data ||
      error.message;

    console.error(
      "EmailJS error:",
      status,
      message
    );

    if (status === 403) {
      throw new Error(
        "Email service rejected the server request. Enable server-side API access in EmailJS Account → Security."
      );
    }

    throw new Error(
      "Unable to send email OTP. Please try again."
    );
  }
}