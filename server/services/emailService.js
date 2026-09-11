import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function sendEmailOTP(email, otp) {

  console.log("Email OTP request:");
  console.log("Email:", email);
  console.log("Service:", process.env.EMAILJS_SERVICE_ID);
  console.log("Template:", process.env.EMAILJS_TEMPLATE_ID);
  console.log(
    "Public Key exists:",
    !!process.env.EMAILJS_PUBLIC_KEY
  );
  console.log(
    "Private Key exists:",
    !!process.env.EMAILJS_PRIVATE_KEY
  );

  const url =
    "https://api.emailjs.com/api/v1.0/email/send";

  const payload = {
    service_id:
      process.env.EMAILJS_SERVICE_ID,

    template_id:
      process.env.EMAILJS_TEMPLATE_ID,

    user_id:
      process.env.EMAILJS_PUBLIC_KEY,

    accessToken:
      process.env.EMAILJS_PRIVATE_KEY,

    template_params: {
      to_email: email,
      otp: otp,
      expiry_minutes: 15,
    },
  };

  try {

    const response = await axios.post(
      url,
      payload
    );

    console.log(
      "EmailJS response:",
      response.data
    );

    return response.data;

  } catch (error) {

    console.error(
      "EMAILJS ERROR STATUS:",
      error.response?.status
    );

    console.error(
      "EMAILJS ERROR DATA:",
      error.response?.data
    );

    throw error;
  }
}