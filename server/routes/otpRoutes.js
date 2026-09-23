import express from "express";
import {
  getAuth
} from "firebase-admin/auth";

import { adminAuth } from "../services/firebaseAdmin.js";
import { sendEmailOTP } from "../services/emailService.js";

const router = express.Router();

const otpStore = new Map();

const OTP_EXPIRY_MS =
  15 * 60 * 1000;

const RESEND_COOLDOWN_MS =
  30 * 1000;

const MAX_ATTEMPTS = 5;

function generateOTP() {
  return Math.floor(
    100000 +
      Math.random() * 900000
  ).toString();
}

/* =====================================================
   SEND EMAIL OTP
===================================================== */

router.post(
  "/email/send",
  async (req, res) => {
    try {
      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      /*
       * Registration and forgot-password both
       * use email OTP.
       *
       * We only check whether the email exists
       * when the OTP is being used for password
       * reset. If your route needs to distinguish
       * registration from reset, pass purpose.
       */

      const purpose =
        req.body.purpose || "registration";

      if (purpose === "reset-password") {
        try {
          await adminAuth.getUserByEmail(
            email
          );
        } catch (error) {
          if (
            error.code ===
            "auth/user-not-found"
          ) {
            return res.status(404).json({
              success: false,
              message:
                "No account exists with this email.",
            });
          }

          throw error;
        }
      }

      const existing =
        otpStore.get(
          `${purpose}:${email}`
        );

      if (
        existing &&
        Date.now() -
          existing.createdAt <
          RESEND_COOLDOWN_MS
      ) {
        return res.status(429).json({
          success: false,
          message:
            "Please wait before requesting another OTP.",
        });
      }

      const otp =
        generateOTP();

      otpStore.set(
        `${purpose}:${email}`,
        {
          otp,
          email,
          purpose,
          createdAt: Date.now(),
          expiresAt:
            Date.now() +
            OTP_EXPIRY_MS,
          attempts: 0,
          verified: false,
        }
      );

      await sendEmailOTP(
        email,
        otp
      );

      return res.status(200).json({
        success: true,
        message:
          "Email OTP sent successfully.",
        expiresInMinutes: 15,
      });
    } catch (error) {
      console.error(
        "Email OTP send error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Unable to send email OTP.",
      });
    }
  }
);

/* =====================================================
   VERIFY EMAIL OTP
===================================================== */

router.post(
  "/email/verify",
  async (req, res) => {
    try {
      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      const otp =
        String(req.body.otp || "")
          .trim();

      const purpose =
        req.body.purpose ||
        "registration";

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message:
            "Email and OTP are required.",
        });
      }

      const key =
        `${purpose}:${email}`;

      const record =
        otpStore.get(key);

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "OTP not found. Please request a new OTP.",
        });
      }

      if (
        Date.now() >
        record.expiresAt
      ) {
        otpStore.delete(key);

        return res.status(400).json({
          success: false,
          message:
            "OTP has expired. Please request a new OTP.",
        });
      }

      if (
        record.attempts >=
        MAX_ATTEMPTS
      ) {
        otpStore.delete(key);

        return res.status(429).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        });
      }

      if (
        record.otp !== otp
      ) {
        record.attempts += 1;

        return res.status(400).json({
          success: false,
          message:
            "Invalid OTP.",
        });
      }

      record.verified = true;

      otpStore.set(
        key,
        record
      );

      return res.status(200).json({
        success: true,
        verified: true,
        message:
          "Email verified successfully.",
      });
    } catch (error) {
      console.error(
        "Email OTP verification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify email OTP.",
      });
    }
  }
);

/* =====================================================
   RESET PASSWORD
===================================================== */

router.post(
  "/email/reset-password",
  async (req, res) => {
    try {
      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      const newPassword =
        String(
          req.body.newPassword || ""
        );

      if (
        !email ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and new password are required.",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      const key =
        `reset-password:${email}`;

      const record =
        otpStore.get(key);

      if (!record) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify the email OTP first.",
        });
      }

      if (
        Date.now() >
        record.expiresAt
      ) {
        otpStore.delete(key);

        return res.status(400).json({
          success: false,
          message:
            "OTP verification has expired. Please start again.",
        });
      }

      if (!record.verified) {
        return res.status(400).json({
          success: false,
          message:
            "Please verify your email OTP first.",
        });
      }

      const user =
        await adminAuth.getUserByEmail(
          email
        );

      await adminAuth.updateUser(
        user.uid,
        {
          password:
            newPassword,
        }
      );

      otpStore.delete(key);

      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully.",
      });
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      if (
        error.code ===
        "auth/user-not-found"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No account exists with this email.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset password.",
      });
    }
  }
);

export default router;