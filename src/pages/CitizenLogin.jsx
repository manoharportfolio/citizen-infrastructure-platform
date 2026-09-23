import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function CitizenLogin() {
  const navigate = useNavigate();

  // =========================
  // LOGIN STATE
  // =========================

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // =========================
  // FORGOT PASSWORD STATE
  // =========================

  const [forgotPassword, setForgotPassword] = useState(false);

  const [forgotStep, setForgotStep] = useState("email");

  const [emailOTP, setEmailOTP] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  // =========================
  // UI STATE
  // =========================

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);

  // =========================
  // CHECK AUTH
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          navigate("/citizen/dashboard", {
            replace: true,
          });
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  // =========================
  // HANDLE LOGIN INPUT
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
  // LOGIN
  // =========================

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      navigate("/citizen/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      let messageText =
        "Unable to login. Please check your email and password.";

      switch (error.code) {
        case "auth/invalid-credential":
          messageText =
            "Invalid email or password.";
          break;

        case "auth/user-not-found":
          messageText =
            "No account was found with this email.";
          break;

        case "auth/wrong-password":
          messageText =
            "Incorrect password.";
          break;

        case "auth/invalid-email":
          messageText =
            "Please enter a valid email address.";
          break;

        case "auth/too-many-requests":
          messageText =
            "Too many login attempts. Please try again later.";
          break;

        case "auth/network-request-failed":
          messageText =
            "Network error. Please check your internet connection.";
          break;

        default:
          messageText =
            error.message ||
            "Unable to login.";
      }

      setError(messageText);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // OPEN FORGOT PASSWORD
  // =========================

  function handleOpenForgotPassword() {
    setForgotPassword(true);
    setForgotStep("email");

    setEmailOTP("");
    setNewPassword("");
    setConfirmNewPassword("");

    setError("");
    setMessage("");
  }

  // =========================
  // CLOSE FORGOT PASSWORD
  // =========================

  function handleCloseForgotPassword() {
    setForgotPassword(false);
    setForgotStep("email");

    setEmailOTP("");
    setNewPassword("");
    setConfirmNewPassword("");

    setError("");
    setMessage("");
  }

  // =========================
  // SEND EMAIL OTP
  // =========================

  async function handleSendOtp(e) {
    if (e) {
      e.preventDefault();
    }

    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoadingEmail(true);

      const response = await fetch(
        `${API_URL}/api/otp/email/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            purpose: "reset-password",
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
            "Unable to send OTP."
        );
      }

      setForgotStep("otp");

      setMessage(
        "OTP sent to your email. It is valid for 15 minutes."
      );
    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      setError(
        error.message ||
          "Unable to send OTP."
      );
    } finally {
      setLoadingEmail(false);
    }
  }

  // =========================
  // VERIFY EMAIL OTP
  // =========================

  async function handleVerifyOtp(e) {
    if (e) {
      e.preventDefault();
    }

    setError("");
    setMessage("");

    const email = form.email.trim().toLowerCase();

    const otp = emailOTP.trim();

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    try {
      setLoadingEmail(true);

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
            purpose: "reset-password",
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
            "Invalid OTP."
        );
      }

      if (!data.verified) {
        throw new Error(
          "Email verification failed."
        );
      }

      setForgotStep("new-password");

      setMessage(
        "Email verified successfully. Please create a new password."
      );
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      setError(
        error.message ||
          "Unable to verify OTP."
      );
    } finally {
      setLoadingEmail(false);
    }
  }

  // =========================
  // RESET PASSWORD
  // =========================

  async function handleResetPassword(e) {
    if (e) {
      e.preventDefault();
    }

    setError("");
    setMessage("");

    // IMPORTANT:
    // Get the email directly from form state.
    const email = form.email.trim().toLowerCase();

    // Get password directly from state.
    const password = newPassword.trim();

    const confirmPassword =
      confirmNewPassword.trim();

    // Validate email
    if (!email) {
      setError("Email is required.");
      return;
    }

    // Validate password
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoadingEmail(true);

      console.log(
        "Reset password request:",
        {
          email,
          hasPassword: Boolean(password),
        }
      );

      const response = await fetch(
        `${API_URL}/api/otp/email/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            newPassword: password,
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
            "Unable to reset password."
        );
      }

      // =========================
      // SUCCESS
      // =========================

      setMessage(
        "Password reset successfully. You can now login."
      );

      setForgotStep("login");

      setEmailOTP("");

      setNewPassword("");

      setConfirmNewPassword("");
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        error.message ||
          "Unable to reset password."
      );
    } finally {
      setLoadingEmail(false);
    }
  }

  // =========================
  // BACK TO LOGIN
  // =========================

  function handleBackToLogin() {
    setForgotPassword(false);

    setForgotStep("email");

    setEmailOTP("");

    setNewPassword("");

    setConfirmNewPassword("");

    setError("");

    setMessage("");
  }

  // =====================================================
  // FORGOT PASSWORD UI
  // =====================================================

  if (forgotPassword) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">

                {/* HEADER */}
                <div className="text-center mb-4">
                  <h2 className="fw-bold">
                    Reset Password
                  </h2>

                  <p className="text-muted mb-0">
                    Reset your citizen-infrastructure-platform account password
                    using email verification.
                  </p>
                </div>

                {/* ERROR */}
                {error && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {message && (
                  <div
                    className="alert alert-success"
                    role="alert"
                  >
                    {message}
                  </div>
                )}

                {/* ================================= */}
                {/* STEP 1 - EMAIL */}
                {/* ================================= */}

                {forgotStep === "email" && (
                  <form
                    onSubmit={handleSendOtp}
                  >
                    <div className="mb-3">
                      <label
                        htmlFor="forgotEmail"
                        className="form-label fw-semibold"
                      >
                        Email Address
                      </label>

                      <input
                        id="forgotEmail"
                        type="email"
                        className="form-control"
                        placeholder="Enter your registered email"
                        value={form.email}
                        onChange={handleChange}
                        name="email"
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loadingEmail}
                    >
                      {loadingEmail
                        ? "Sending OTP..."
                        : "Send Email OTP"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-link w-100 mt-2 text-decoration-none"
                      onClick={
                        handleBackToLogin
                      }
                    >
                      ← Back to Login
                    </button>
                  </form>
                )}

                {/* ================================= */}
                {/* STEP 2 - OTP */}
                {/* ================================= */}

                {forgotStep === "otp" && (
                  <form
                    onSubmit={handleVerifyOtp}
                  >
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Email Address
                      </label>

                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="emailOTP"
                        className="form-label fw-semibold"
                      >
                        Email OTP
                      </label>

                      <input
                        id="emailOTP"
                        type="text"
                        className="form-control text-center"
                        placeholder="Enter 6-digit OTP"
                        value={emailOTP}
                        onChange={(e) =>
                          setEmailOTP(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          )
                        }
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={
                        loadingEmail
                      }
                    >
                      {loadingEmail
                        ? "Verifying..."
                        : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 mt-2"
                      onClick={() =>
                        setForgotStep(
                          "email"
                        )
                      }
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      className="btn btn-link w-100 mt-2 text-decoration-none"
                      onClick={
                        handleBackToLogin
                      }
                    >
                      ← Back to Login
                    </button>
                  </form>
                )}

                {/* ================================= */}
                {/* STEP 3 - NEW PASSWORD */}
                {/* ================================= */}

                {forgotStep ===
                  "new-password" && (
                  <form
                    onSubmit={
                      handleResetPassword
                    }
                  >
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Email Address
                      </label>

                      <input
                        type="email"
                        className="form-control"
                        value={form.email}
                        disabled
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="newPassword"
                        className="form-label fw-semibold"
                      >
                        New Password
                      </label>

                      <input
                        id="newPassword"
                        type="password"
                        className="form-control"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        autoComplete="new-password"
                      />

                      <div className="form-text">
                        Password must contain at
                        least 6 characters.
                      </div>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="confirmNewPassword"
                        className="form-label fw-semibold"
                      >
                        Confirm New Password
                      </label>

                      <input
                        id="confirmNewPassword"
                        type="password"
                        className="form-control"
                        placeholder="Confirm new password"
                        value={
                          confirmNewPassword
                        }
                        onChange={(e) =>
                          setConfirmNewPassword(
                            e.target.value
                          )
                        }
                        autoComplete="new-password"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={
                        loadingEmail
                      }
                    >
                      {loadingEmail
                        ? "Resetting Password..."
                        : "Reset Password"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-link w-100 mt-2 text-decoration-none"
                      onClick={
                        handleBackToLogin
                      }
                    >
                      ← Back to Login
                    </button>
                  </form>
                )}

                {/* ================================= */}
                {/* STEP 4 - RESET SUCCESS */}
                {/* ================================= */}

                {forgotStep ===
                  "login" && (
                  <div className="text-center">
                    <div
                      className="mb-3"
                      style={{
                        fontSize: "3rem",
                      }}
                    >
                      ✓
                    </div>

                    <h4 className="fw-bold">
                      Password Reset Successful
                    </h4>

                    <p className="text-muted">
                      Your password has been
                      updated successfully.
                    </p>

                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={
                        handleBackToLogin
                      }
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL LOGIN UI
  // =====================================================

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">

              {/* HEADER */}
              <div className="text-center mb-4">
                <h2 className="fw-bold">
                  Citizen Login
                </h2>

                <p className="text-muted mb-0">
                  Login to report and track
                  infrastructure complaints.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* SUCCESS */}
              {message && (
                <div
                  className="alert alert-success"
                  role="alert"
                >
                  {message}
                </div>
              )}

              {/* LOGIN FORM */}
              <form
                onSubmit={handleLogin}
              >
                {/* EMAIL */}
                <div className="mb-3">
                  <label
                    htmlFor="loginEmail"
                    className="form-label fw-semibold"
                  >
                    Email Address
                  </label>

                  <input
                    id="loginEmail"
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>

                {/* PASSWORD */}
                <div className="mb-2">
                  <label
                    htmlFor="loginPassword"
                    className="form-label fw-semibold"
                  >
                    Password
                  </label>

                  <input
                    id="loginPassword"
                    type="password"
                    className="form-control"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>

                {/* FORGOT PASSWORD */}
                <div className="text-end mb-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={
                      handleOpenForgotPassword
                    }
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </button>
              </form>

              {/* REGISTER */}
              <div className="text-center mt-4">
                <span className="text-muted">
                  Don't have an account?
                </span>{" "}
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  onClick={() =>
                    navigate(
                      "/citizen/register"
                    )
                  }
                >
                  Register
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenLogin;