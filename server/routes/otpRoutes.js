import express from "express";
import crypto from "crypto";

import { sendEmailOTP } from "../services/emailService.js";
import { sendPhoneOTP } from "../services/phoneService.js";

const router = express.Router();

const otpStore = new Map();

const OTP_EXPIRY = 15 * 60 * 1000;
const RESEND_COOLDOWN = 30 * 1000;
const MAX_ATTEMPTS = 5;

function generateOTP() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function hashOTP(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone) {
  return phone.replace(/\s+/g, "");
}

function createOTPRecord(otp) {
  return {
    otpHash: hashOTP(otp),
    expiresAt: Date.now() + OTP_EXPIRY,
    attempts: 0,
    lastSentAt: Date.now(),
    verified: false,
  };
}


// ===============================
// SEND EMAIL OTP
// ===============================

router.post("/email/send", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    const key = `email:${normalizedEmail}`;

    const existing = otpStore.get(key);

    if (
      existing &&
      Date.now() - existing.lastSentAt <
        RESEND_COOLDOWN
    ) {
      const remaining = Math.ceil(
        (
          RESEND_COOLDOWN -
          (Date.now() - existing.lastSentAt)
        ) / 1000
      );

      return res.status(429).json({
        message:
          `Please wait ${remaining} seconds before requesting another OTP.`,
      });
    }

    const otp = generateOTP();

    otpStore.set(
      key,
      createOTPRecord(otp)
    );

    await sendEmailOTP(
      normalizedEmail,
      otp
    );

    res.json({
      success: true,
      message:
        "Email OTP sent successfully.",
      expiresIn: 900,
    });

  } catch (error) {

    console.error(
      "Email OTP error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to send email OTP.",
    });
  }
});


// ===============================
// VERIFY EMAIL OTP
// ===============================

router.post(
  "/email/verify",
  (req, res) => {

    const { email, otp } =
      req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message:
          "Email and OTP are required.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    const key =
      `email:${normalizedEmail}`;

    const record =
      otpStore.get(key);

    if (!record) {
      return res.status(400).json({
        message:
          "No OTP found. Please request a new OTP.",
      });
    }

    if (Date.now() > record.expiresAt) {

      otpStore.delete(key);

      return res.status(400).json({
        message:
          "OTP expired. Please request a new OTP.",
      });
    }

    if (
      record.attempts >=
      MAX_ATTEMPTS
    ) {

      otpStore.delete(key);

      return res.status(400).json({
        message:
          "Too many attempts. Please request a new OTP.",
      });
    }

    record.attempts++;

    if (
      hashOTP(otp) !==
      record.otpHash
    ) {

      return res.status(400).json({
        message: "Invalid OTP.",
        attemptsRemaining:
          MAX_ATTEMPTS -
          record.attempts,
      });
    }

    record.verified = true;

    res.json({
      success: true,
      verified: true,
      message:
        "Email verified successfully.",
    });
  }
);


// ===============================
// SEND PHONE OTP
// ===============================

router.post(
  "/phone/send",
  async (req, res) => {

    try {

      const { phone } =
        req.body;

      if (!phone) {
        return res.status(400).json({
          message:
            "Phone number is required.",
        });
      }

      const normalizedPhone =
        normalizePhone(phone);

      const key =
        `phone:${normalizedPhone}`;

      const existing =
        otpStore.get(key);

      if (
        existing &&
        Date.now() -
          existing.lastSentAt <
          RESEND_COOLDOWN
      ) {

        const remaining =
          Math.ceil(
            (
              RESEND_COOLDOWN -
              (
                Date.now() -
                existing.lastSentAt
              )
            ) / 1000
          );

        return res.status(429).json({
          message:
            `Please wait ${remaining} seconds before requesting another OTP.`,
        });
      }

      const otp =
        generateOTP();

      otpStore.set(
        key,
        createOTPRecord(otp)
      );

      await sendPhoneOTP(
        normalizedPhone,
        otp
      );

      res.json({
        success: true,
        message:
          "Phone OTP sent successfully.",
        expiresIn: 900,
      });

    } catch (error) {

      console.error(
        "Phone OTP error:",
        error
      );

      res.status(500).json({
        message:
          "Unable to send phone OTP.",
      });
    }
  }
);


// ===============================
// VERIFY PHONE OTP
// ===============================

router.post(
  "/phone/verify",
  (req, res) => {

    const { phone, otp } =
      req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message:
          "Phone and OTP are required.",
      });
    }

    const normalizedPhone =
      normalizePhone(phone);

    const key =
      `phone:${normalizedPhone}`;

    const record =
      otpStore.get(key);

    if (!record) {
      return res.status(400).json({
        message:
          "No OTP found. Please request a new OTP.",
      });
    }

    if (Date.now() > record.expiresAt) {

      otpStore.delete(key);

      return res.status(400).json({
        message:
          "OTP expired. Please request a new OTP.",
      });
    }

    if (
      record.attempts >=
      MAX_ATTEMPTS
    ) {

      otpStore.delete(key);

      return res.status(400).json({
        message:
          "Too many attempts. Please request a new OTP.",
      });
    }

    record.attempts++;

    if (
      hashOTP(otp) !==
      record.otpHash
    ) {

      return res.status(400).json({
        message: "Invalid OTP.",
        attemptsRemaining:
          MAX_ATTEMPTS -
          record.attempts,
      });
    }

    record.verified = true;

    res.json({
      success: true,
      verified: true,
      message:
        "Phone verified successfully.",
    });
  }
);

export default router;