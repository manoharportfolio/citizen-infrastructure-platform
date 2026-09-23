import { useEffect, useState } from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "../firebase/config";

function CitizenProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (!currentUser) {
            navigate(
              "/citizen/login",
              { replace: true }
            );
            return;
          }

          try {
            setUser(currentUser);

            const userRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const snapshot =
              await getDoc(userRef);

            if (!snapshot.exists()) {
              setError(
                "Your profile could not be found."
              );
              return;
            }

            const profileData =
              snapshot.data();

            setProfile(profileData);

            setName(
              profileData.fullName || ""
            );

            setEmail(
              profileData.email || ""
            );

            setPhoneNumber(
              profileData.phoneNumber || ""
            );

          } catch (err) {
            console.error(
              "Profile loading error:",
              err
            );

            setError(
              "Unable to load your profile."
            );

          } finally {
            setLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const trimmedName =
      name.trim();

    const trimmedPhone =
      phoneNumber.trim();

    if (!trimmedName) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (!trimmedPhone) {
      setError(
        "Please enter your phone number."
      );
      return;
    }

    const phoneDigits =
      trimmedPhone.replace(/\D/g, "");

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 15
    ) {
      setError(
        "Please enter a valid phone number."
      );
      return;
    }

    if (!user) {
      setError(
        "User session not found."
      );
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await updateDoc(
        userRef,
        {
          fullName: trimmedName,
          phoneNumber: trimmedPhone
        }
      );

      const updatedProfile = {
        ...profile,
        fullName: trimmedName,
        email,
        phoneNumber: trimmedPhone
      };

      setProfile(updatedProfile);

      setMessage(
        "Profile updated successfully."
      );

    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
        "Unable to update your profile."
      );

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border"
          role="status"
        ></div>

        <p className="mt-3">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-5">

        <div className="alert alert-danger">
          {error ||
            "Profile not found."}
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

      </div>
    );
  }

  const initial =
    name.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="container py-5">

      <div className="row justify-content-center">

        <div className="col-12 col-md-8 col-lg-7">

          <div className="card border-0 shadow-sm">

            <div className="card-body p-4 p-md-5">

              <div className="d-flex align-items-center mb-4">

                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "64px",
                    height: "64px",
                    fontSize: "28px",
                    fontWeight: "600"
                  }}
                >
                  {initial}
                </div>

                <div>
                  <h3 className="mb-1">
                    Edit Profile
                  </h3>

                  <p className="text-muted mb-0">
                    Update your citizen profile
                  </p>
                </div>

              </div>

              {message && (
                <div className="alert alert-success">
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave}>

                <div className="mb-3">

                  <label
                    htmlFor="profile-name"
                    className="form-label fw-semibold"
                  >
                    Full Name
                  </label>

                  <input
                    id="profile-name"
                    type="text"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    disabled={saving}
                  />

                </div>

                <div className="mb-3">

                  <label
                    htmlFor="profile-email"
                    className="form-label fw-semibold"
                  >
                    Email Address
                  </label>

                  <input
                    id="profile-email"
                    type="email"
                    className="form-control form-control-lg"
                    value={email}
                    disabled
                  />

                </div>

                <div className="mb-4">

                  <label
                    htmlFor="profile-phone"
                    className="form-label fw-semibold"
                  >
                    Phone Number
                  </label>

                  <input
                    id="profile-phone"
                    type="tel"
                    className="form-control form-control-lg"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(
                        event.target.value
                      )
                    }
                    disabled={saving}
                    inputMode="tel"
                  />

                </div>

                <div className="d-flex gap-2">

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() =>
                      navigate(-1)
                    }
                    disabled={saving}
                  >
                    Back
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CitizenProfile;