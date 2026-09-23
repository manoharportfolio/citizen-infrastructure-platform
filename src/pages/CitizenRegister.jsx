import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/config";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function CitizenRegister() {
  const navigate = useNavigate();

  // =========================
  // FORM
  // =========================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // =========================
  // REGISTRATION STEPS
  // =========================

  const [step, setStep] = useState("details");

  /*
    details
       ↓
    email-otp
       ↓
    success
  */

  // =========================
  // OTP
  // =========================

  const [emailOTP, setEmailOTP] = useState("");

  // =========================
  // UI
  // =========================

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingOTP, setLoadingOTP] = useState(false);

  // =========================
  // HANDLE INPUT
  // =========================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  }

  // =========================
  // VALIDATE FORM
  // =========================

  function validateForm() {
    const name = form.name.trim();

    const email = form.email
      .trim()
      .toLowerCase();

    const phone = form.phone.trim();

    const password = form.password;

    const confirmPassword =
      form.confirmPassword;

    if (!name) {
      return "Please enter your full name.";
    }

    if (name.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!phone) {
      return "Please enter your phone number.";
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!password) {
      return "Please enter a password.";
    }

    if (password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  }

  // =========================
  // SEND REGISTRATION OTP
  // =========================

  async function handleSendOTP(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const email = form.email
      .trim()
      .toLowerCase();

    try {
      setLoadingOTP(true);

      const response = await fetch(
        `${API_URL}/api/otp/email/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            purpose: "registration",
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to send email OTP."
        );
      }

      setStep("email-otp");

      setMessage(
        "OTP has been sent to your email. Please check your inbox."
      );
    } catch (error) {
      console.error(
        "Send registration OTP error:",
        error
      );

      setError(
        error.message ||
          "Unable to send OTP."
      );
    } finally {
      setLoadingOTP(false);
    }
  }

  // =========================
  // VERIFY REGISTRATION OTP
  // =========================

  async function handleVerifyOTP(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const email = form.email
      .trim()
      .toLowerCase();

    const otp = emailOTP.trim();

    if (!email) {
      setError("Email address is required.");
      return;
    }

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      // ==========================================
      // VERIFY OTP
      // ==========================================

      const otpResponse = await fetch(
        `${API_URL}/api/otp/email/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            purpose: "registration",
          }),
        }
      );

      let otpData;

      try {
        otpData = await otpResponse.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!otpResponse.ok) {
        throw new Error(
          otpData.message ||
            "Invalid OTP."
        );
      }

      if (!otpData.verified) {
        throw new Error(
          "Email verification failed."
        );
      }

      // ==========================================
      // CREATE FIREBASE ACCOUNT
      // ==========================================

      let createdUser = null;

      try {
        const credential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            form.password
          );

        createdUser = credential.user;

        // ========================================
        // SAVE USER PROFILE
        // ========================================

        await setDoc(
          doc(
            db,
            "users",
            createdUser.uid
          ),
          {
            uid: createdUser.uid,

            role: "citizen",

            fullName:
              form.name.trim(),

            email,

            phoneNumber:
              form.phone.trim(),

            emailVerified: true,

            accountStatus: "active",

            createdAt:
              serverTimestamp(),

            lastLoginAt:
              serverTimestamp(),
          }
        );
      } catch (firebaseError) {
        console.error(
          "Firebase registration error:",
          firebaseError
        );

        /*
          If Firebase account was created
          but Firestore failed, delete the
          newly-created Firebase account so
          we don't leave an incomplete account.
        */

        if (createdUser) {
          try {
            await deleteUser(
              createdUser
            );
          } catch (deleteError) {
            console.error(
              "Unable to rollback Firebase account:",
              deleteError
            );
          }
        }

        throw firebaseError;
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      setStep("success");

      setMessage(
        "Your account has been created successfully."
      );
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      let errorMessage =
        "Unable to create your account.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage =
            "An account already exists with this email address.";
          break;

        case "auth/invalid-email":
          errorMessage =
            "Please enter a valid email address.";
          break;

        case "auth/weak-password":
          errorMessage =
            "Password is too weak. Use at least 6 characters.";
          break;

        case "auth/network-request-failed":
          errorMessage =
            "Network error. Please check your internet connection.";
          break;

        default:
          errorMessage =
            error.message ||
            errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // CHANGE EMAIL
  // =========================

  function handleChangeEmail() {
    setStep("details");

    setEmailOTP("");

    setError("");

    setMessage("");
  }

  // =========================
  // LOGIN
  // =========================

  function handleLogin() {
    navigate("/citizen/login");
  }

  // =========================
  // SUCCESS PAGE
  // =========================

  if (step === "success") {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-md-5 text-center">

                <div
                  className="mb-4"
                  style={{
                    fontSize: "4rem",
                  }}
                >
                  ✓
                </div>

                <h2 className="fw-bold mb-3">
                  Registration Successful
                </h2>

                <p className="text-muted mb-4">
                  Your email has been verified and
                  your citizen-infrastructure-platform account has been created.
                </p>

                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={handleLogin}
                >
                  Go to Login
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // REGISTRATION PAGE
  // =====================================================

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-6">

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">

              {/* ================================= */}
              {/* HEADER */}
              {/* ================================= */}

              <div className="text-center mb-4">

                <h2 className="fw-bold">
                  Citizen Registration
                </h2>

                <p className="text-muted mb-0">
                  Create your citizen-infrastructure-platform citizen account.
                </p>

              </div>

              {/* ================================= */}
              {/* ERROR */}
              {/* ================================= */}

              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* ================================= */}
              {/* MESSAGE */}
              {/* ================================= */}

              {message && (
                <div
                  className="alert alert-success"
                  role="alert"
                >
                  {message}
                </div>
              )}

              {/* ================================= */}
              {/* STEP 1: DETAILS */}
              {/* ================================= */}

              {step === "details" && (
                <form
                  onSubmit={handleSendOTP}
                >

                  {/* NAME */}

                  <div className="mb-3">
                    <label
                      htmlFor="name"
                      className="form-label fw-semibold"
                    >
                      Full Name
                    </label>

                    <input
                      id="name"
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                    />
                  </div>

                  {/* EMAIL */}

                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label fw-semibold"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />

                    <div className="form-text">
                      An OTP will be sent to this email.
                    </div>
                  </div>

                  {/* PHONE */}

                  <div className="mb-3">
                    <label
                      htmlFor="phone"
                      className="form-label fw-semibold"
                    >
                      Phone Number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="Enter 10-digit phone number"
                      value={form.phone}
                      onChange={(e) => {
                        const value =
                          e.target.value.replace(
                            /\D/g,
                            ""
                          );

                        setForm((previous) => ({
                          ...previous,
                          phone: value,
                        }));

                        setError("");
                        setMessage("");
                      }}
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                    />

                    <div className="form-text">
                      Phone number is collected for
                      your profile. No phone OTP is required.
                    </div>
                  </div>

                  {/* PASSWORD */}

                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label fw-semibold"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="Create a password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />

                    <div className="form-text">
                      Minimum 6 characters.
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label fw-semibold"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Confirm your password"
                      value={
                        form.confirmPassword
                      }
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                  </div>

                  {/* SEND OTP */}

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loadingOTP}
                  >
                    {loadingOTP
                      ? "Sending OTP..."
                      : "Continue & Verify Email"}
                  </button>

                  {/* LOGIN */}

                  <div className="text-center mt-4">
                    <span className="text-muted">
                      Already have an account?
                    </span>{" "}

                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={handleLogin}
                    >
                      Login
                    </button>
                  </div>

                  {/* HOME */}

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-muted text-decoration-none"
                      onClick={() =>
                        navigate("/")
                      }
                    >
                      ← Back to Home
                    </button>
                  </div>

                </form>
              )}

              {/* ================================= */}
              {/* STEP 2: EMAIL OTP */}
              {/* ================================= */}

              {step === "email-otp" && (
                <form
                  onSubmit={handleVerifyOTP}
                >

                  <div className="text-center mb-4">

                    <div
                      className="mb-3"
                      style={{
                        fontSize: "3rem",
                      }}
                    >
                      ✉️
                    </div>

                    <h4 className="fw-bold">
                      Verify Your Email
                    </h4>

                    <p className="text-muted mb-0">
                      We sent a 6-digit OTP to:
                    </p>

                    <strong>
                      {form.email}
                    </strong>

                  </div>

                  {/* EMAIL */}

                  <div className="mb-3">
                    <label
                      htmlFor="verifiedEmail"
                      className="form-label fw-semibold"
                    >
                      Email Address
                    </label>

                    <input
                      id="verifiedEmail"
                      type="email"
                      className="form-control"
                      value={form.email}
                      disabled
                    />
                  </div>

                  {/* OTP */}

                  <div className="mb-4">
                    <label
                      htmlFor="registrationOTP"
                      className="form-label fw-semibold"
                    >
                      Email OTP
                    </label>

                    <input
                      id="registrationOTP"
                      type="text"
                      className="form-control text-center"
                      placeholder="Enter 6-digit OTP"
                      value={emailOTP}
                      onChange={(e) => {
                        const value =
                          e.target.value.replace(
                            /\D/g,
                            ""
                          );

                        setEmailOTP(value);

                        setError("");
                        setMessage("");
                      }}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      style={{
                        letterSpacing:
                          "0.4rem",
                        fontSize: "1.2rem",
                      }}
                    />
                  </div>

                  {/* VERIFY */}

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading
                      ? "Verifying & Creating Account..."
                      : "Verify Email & Register"}
                  </button>

                  {/* CHANGE EMAIL */}

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 mt-2"
                    onClick={
                      handleChangeEmail
                    }
                  >
                    Change Email
                  </button>

                  {/* LOGIN */}

                  <button
                    type="button"
                    className="btn btn-link w-100 mt-2 text-decoration-none"
                    onClick={
                      handleLogin
                    }
                  >
                    ← Back to Login
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CitizenRegister;