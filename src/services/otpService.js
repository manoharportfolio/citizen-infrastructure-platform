const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export async function sendEmailOTP(email) {
  const response = await fetch(
    `${API_URL}/api/otp/email/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to send email OTP."
    );
  }

  return data;
}


export async function verifyEmailOTP(
  email,
  otp
) {
  const response = await fetch(
    `${API_URL}/api/otp/email/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to verify email OTP."
    );
  }

  return data;
}


export async function sendPhoneOTP(
  phone
) {
  const response = await fetch(
    `${API_URL}/api/otp/phone/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to send phone OTP."
    );
  }

  return data;
}


export async function verifyPhoneOTP(
  phone,
  otp
) {
  const response = await fetch(
    `${API_URL}/api/otp/phone/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        otp,
      }),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to verify phone OTP."
    );
  }

  return data;
}