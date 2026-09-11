import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

import {
  sendEmailOTP,
  verifyEmailOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
} from "../services/otpService";

function CitizenRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");

  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);

  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSendEmailOTP() {
    setError("");
    setMessage("");

    if (!form.email) {
      setError("Please enter your email first.");
      return;
    }

    try {
      setLoadingEmail(true);

      await sendEmailOTP(form.email);

      setEmailSent(true);
      setMessage("Email OTP sent. It is valid for 15 minutes.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleVerifyEmailOTP() {
    setError("");
    setMessage("");

    if (!emailOTP) {
      setError("Please enter the email OTP.");
      return;
    }

    try {
      setLoadingEmail(true);

      const result = await verifyEmailOTP(
        form.email,
        emailOTP
      );

      if (result.verified) {
        setEmailVerified(true);
        setMessage("Email verified successfully.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingEmail(false);
    }
  }

  async function handleSendPhoneOTP() {
    setError("");
    setMessage("");

    if (!form.phone) {
      setError("Please enter your phone number first.");
      return;
    }

    try {
      setLoadingPhone(true);

      await sendPhoneOTP(form.phone);

      setPhoneSent(true);
      setMessage(
        "Phone OTP generated. Check the backend terminal during development."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPhone(false);
    }
  }

  async function handleVerifyPhoneOTP() {
    setError("");
    setMessage("");

    if (!phoneOTP) {
      setError("Please enter the phone OTP.");
      return;
    }

    try {
      setLoadingPhone(true);

      const result = await verifyPhoneOTP(
        form.phone,
        phoneOTP
      );

      if (result.verified) {
        setPhoneVerified(true);
        setMessage("Phone verified successfully.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPhone(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!emailVerified || !phoneVerified) {
      setError(
        "Please verify both your email and phone number."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setRegistering(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        role: "citizen",
        fullName: form.name,
        dob: form.dob,
        email: form.email,
        phoneNumber: form.phone,
        emailVerified: true,
        phoneVerified: true,
        accountStatus: "active",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });

      navigate("/citizen/dashboard");

    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setError(
          "An account already exists with this email."
        );
      } else {
        setError(
          err.message || "Registration failed."
        );
      }
    } finally {
      setRegistering(false);
    }
  }

  const canRegister =
    emailVerified && phoneVerified;

  return (
    <div className="container py-5">

      <div className="row justify-content-center">

        <div className="col-lg-7">

          <div className="card">
            <div className="card-body p-4">

              <h2 className="fw-bold">
                Citizen Registration
              </h2>

              <p className="text-muted">
                Create your citizen account.
              </p>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {message && (
                <div className="alert alert-info">
                  {message}
                </div>
              )}

              <form onSubmit={handleRegister}>

                <div className="mb-3">
                  <label className="form-label">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="dob"
                    className="form-control"
                    value={form.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* EMAIL */}

                <div className="mb-3">

                  <label className="form-label">
                    Email Address
                  </label>

                  <div className="input-group">

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={form.email}
                      onChange={handleChange}
                      disabled={emailVerified}
                      required
                    />

                    {!emailVerified && (
                      <button
                        type="button"
                        className="btn btn-outline-dark"
                        onClick={handleSendEmailOTP}
                        disabled={loadingEmail}
                      >
                        {loadingEmail
                          ? "Sending..."
                          : "Verify"}
                      </button>
                    )}

                    {emailVerified && (
                      <span className="input-group-text text-success">
                        <i className="bi bi-check-circle-fill"></i>
                        &nbsp; Verified
                      </span>
                    )}

                  </div>

                </div>

                {emailSent && !emailVerified && (
                  <div className="mb-3">

                    <label className="form-label">
                      Email OTP
                    </label>

                    <div className="input-group">

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        value={emailOTP}
                        onChange={(e) =>
                          setEmailOTP(
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                      />

                      <button
                        type="button"
                        className="btn btn-dark"
                        onClick={handleVerifyEmailOTP}
                        disabled={loadingEmail}
                      >
                        Verify OTP
                      </button>

                    </div>

                    <small className="text-muted">
                      OTP expires after 15 minutes.
                    </small>

                  </div>
                )}

                {/* PHONE */}

                <div className="mb-3">

                  <label className="form-label">
                    Phone Number
                  </label>

                  <div className="input-group">

                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="+91XXXXXXXXXX"
                      value={form.phone}
                      onChange={handleChange}
                      disabled={phoneVerified}
                      required
                    />

                    {!phoneVerified && (
                      <button
                        type="button"
                        className="btn btn-outline-dark"
                        onClick={handleSendPhoneOTP}
                        disabled={loadingPhone}
                      >
                        {loadingPhone
                          ? "Sending..."
                          : "Verify"}
                      </button>
                    )}

                    {phoneVerified && (
                      <span className="input-group-text text-success">
                        <i className="bi bi-check-circle-fill"></i>
                        &nbsp; Verified
                      </span>
                    )}

                  </div>

                </div>

                {phoneSent && !phoneVerified && (
                  <div className="mb-3">

                    <label className="form-label">
                      Phone OTP
                    </label>

                    <div className="input-group">

                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        value={phoneOTP}
                        onChange={(e) =>
                          setPhoneOTP(
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                      />

                      <button
                        type="button"
                        className="btn btn-dark"
                        onClick={handleVerifyPhoneOTP}
                        disabled={loadingPhone}
                      >
                        Verify OTP
                      </button>

                    </div>

                    <small className="text-muted">
                      OTP expires after 15 minutes.
                    </small>

                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`btn w-100 ${
                    canRegister
                      ? "btn-dark"
                      : "btn-secondary"
                  }`}
                  disabled={
                    !canRegister || registering
                  }
                >
                  {registering
                    ? "Creating Account..."
                    : "Register"}
                </button>

              </form>

              <div className="text-center mt-4">
                <span className="text-muted">
                  Already have an account?
                </span>{" "}
                <Link to="/citizen/login">
                  Login
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default CitizenRegister;
