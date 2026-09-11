import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/config";

function CitizenDashboard() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/citizen/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data());
        } else {
          setError("User profile not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  async function handleLogout() {
    await signOut(auth);
    navigate("/citizen/login");
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status"></div>
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Welcome, {userData?.fullName}
          </h2>

          <p className="text-muted mb-0">
            Citizen Dashboard
          </p>
        </div>

        <button
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Profile */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">

          <h4 className="fw-bold mb-4">
            My Profile
          </h4>

          <div className="row g-4">

            {/* Name */}
            <div className="col-md-6">
              <label className="text-muted small">
                Full Name
              </label>

              <div className="fw-semibold">
                {userData?.fullName || "Not available"}
              </div>
            </div>

            {/* DOB */}
            <div className="col-md-6">
              <label className="text-muted small">
                Date of Birth
              </label>

              <div className="fw-semibold">
                {userData?.dob || "Not available"}
              </div>
            </div>

            {/* Email */}
            <div className="col-md-6">
              <label className="text-muted small">
                Email Address
              </label>

              <div className="fw-semibold">
                {userData?.email || "Not available"}
              </div>

              {userData?.emailVerified && (
                <span className="badge text-bg-success mt-2">
                  Email Verified
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="col-md-6">
              <label className="text-muted small">
                Phone Number
              </label>

              <div className="fw-semibold">
                {userData?.phoneNumber || "Not available"}
              </div>

              {userData?.phoneVerified && (
                <span className="badge text-bg-success mt-2">
                  Phone Verified
                </span>
              )}
            </div>

            {/* Role */}
            <div className="col-md-6">
              <label className="text-muted small">
                Account Type
              </label>

              <div className="fw-semibold text-capitalize">
                {userData?.role || "Citizen"}
              </div>
            </div>

            {/* Status */}
            <div className="col-md-6">
              <label className="text-muted small">
                Account Status
              </label>

              <div>
                <span className="badge text-bg-success text-capitalize">
                  {userData?.accountStatus || "Active"}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Actions */}
      <div className="row g-4">

        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold">
                Report an Issue
              </h5>

              <p className="text-muted">
                Report infrastructure problems in your area.
              </p>

              <button className="btn btn-dark">
                Report Now
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold">
                My Reports
              </h5>

              <p className="text-muted">
                View and track the infrastructure issues you reported.
              </p>

              <button className="btn btn-outline-dark">
                View Reports
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default CitizenDashboard;