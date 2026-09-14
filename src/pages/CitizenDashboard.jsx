import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

function CitizenDashboard() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          navigate("/citizen/login");
          return;
        }

        try {
          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnapshot =
            await getDoc(userRef);

          if (userSnapshot.exists()) {
            setUserData(
              userSnapshot.data()
            );
          } else {
            // Fallback if profile document
            // doesn't exist
            setUserData({
              fullName:
                user.displayName ||
                "Citizen",
              email: user.email || "",
            });
          }
        } catch (error) {
          console.error(
            "Error loading user profile:",
            error
          );

          setUserData({
            fullName:
              user.displayName ||
              "Citizen",
            email: user.email || "",
          });
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/citizen/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="container py-5 text-center">

        <div
          className="spinner-border"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <p className="text-muted mt-3">
          Loading your dashboard...
        </p>

      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="container py-5">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h2 className="fw-bold mb-1">
            Citizen Dashboard
          </h2>

          <p className="text-muted mb-0">
            Welcome back,{" "}
            <strong>
              {userData?.fullName ||
                "Citizen"}
            </strong>
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      {/* =====================================
          WELCOME MESSAGE
      ====================================== */}

      <div className="alert alert-info mb-4">

        <strong>
          Help improve your community.
        </strong>

        <br />

        Report infrastructure problems so
        they can be analyzed, prioritized,
        and addressed.

      </div>

      {/* =====================================
          REPORTING OPTIONS
      ====================================== */}

      <div className="row g-4">

        {/* =================================
            REPORT NOW
        ================================== */}

        <div className="col-md-6">

          <div className="card h-100 shadow-sm">

            <div className="card-body p-4">

              <div
                className="mb-3"
                style={{
                  fontSize: "40px",
                }}
              >
                📍
              </div>

              <h4 className="fw-bold">
                Report Now
              </h4>

              <p className="text-muted">
                Report an infrastructure problem
                that you are seeing right now.
              </p>

              <ul className="text-muted ps-3">

                <li>
                  Current GPS location
                </li>

                <li>
                  Fresh camera evidence
                </li>

                <li>
                  Real-time observation
                </li>

              </ul>

              <button
                type="button"
                className="btn btn-dark w-100 mt-3"
                onClick={() =>
                  navigate(
                    "/citizen/report"
                  )
                }
              >
                📍 Report Now
              </button>

            </div>

          </div>

        </div>

        {/* =================================
            REPORT SOMETHING I SAW
        ================================== */}

        <div className="col-md-6">

          <div className="card h-100 shadow-sm">

            <div className="card-body p-4">

              <div
                className="mb-3"
                style={{
                  fontSize: "40px",
                }}
              >
                📝
              </div>

              <h4 className="fw-bold">
                Report Something I Saw
              </h4>

              <p className="text-muted">
                Report an infrastructure problem
                that you noticed earlier.
              </p>

              <ul className="text-muted ps-3">

                <li>
                  Enter observation date
                </li>

                <li>
                  Enter approximate location
                </li>

                <li>
                  Describe what you saw
                </li>

              </ul>

              <button
                type="button"
                className="btn btn-outline-dark w-100 mt-3"
                onClick={() =>
                  navigate(
                    "/citizen/report-something"
                  )
                }
              >
                📝 Report Something I Saw
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          MY REPORTS
      ====================================== */}

      <div className="card shadow-sm mt-4">

        <div className="card-body p-4">

          <h5 className="fw-bold">
            My Reports
          </h5>

          <p className="text-muted mb-3">
            Your submitted reports and their
            current status will appear here.
          </p>

          {/* Day 6 will connect this section
              to Firestore */}

          <div className="alert alert-secondary mb-0">

            You haven't submitted any reports
            yet.

          </div>

        </div>

      </div>

      {/* =====================================
          PROFILE
      ====================================== */}

      <div className="card shadow-sm mt-4">

        <div className="card-body p-4">

          <h5 className="fw-bold mb-3">
            My Profile
          </h5>

          <div className="row">

            <div className="col-md-6 mb-3">

              <small className="text-muted">
                Name
              </small>

              <div className="fw-semibold">
                {userData?.fullName ||
                  "Not available"}
              </div>

            </div>

            <div className="col-md-6 mb-3">

              <small className="text-muted">
                Email
              </small>

              <div className="fw-semibold">
                {userData?.email ||
                  "Not available"}
              </div>

            </div>

            <div className="col-md-6 mb-3">

              <small className="text-muted">
                Phone
              </small>

              <div className="fw-semibold">
                {userData?.phoneNumber ||
                  "Not available"}
              </div>

            </div>

            <div className="col-md-6 mb-3">

              <small className="text-muted">
                Account Type
              </small>

              <div className="fw-semibold">
                Citizen
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CitizenDashboard;