import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

function CitizenDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          navigate("/citizen/login");
          return;
        }

        try {
          setUser(currentUser);

          const userRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            setProfile(userSnapshot.data());
          }

          await loadReports(currentUser.uid);
        } catch (err) {
          console.error(
            "Dashboard loading error:",
            err
          );

          setError(
            "Unable to load your dashboard."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  const loadReports = async (uid) => {
    try {
      setReportsLoading(true);

      const reportsQuery = query(
        collection(db, "reports"),
        where("userId", "==", uid)
      );

      const snapshot = await getDocs(reportsQuery);

      const reportList = snapshot.docs.map((reportDoc) => ({
        id: reportDoc.id,
        ...reportDoc.data(),
      }));

      /*
       * Sort newest reports first.
       * We sort in JavaScript so we don't need
       * a Firestore composite index.
       */
      reportList.sort((a, b) => {
        const timeA =
          a.createdAt?.toMillis?.() || 0;

        const timeB =
          b.createdAt?.toMillis?.() || 0;

        return timeB - timeA;
      });

      setReports(reportList);
    } catch (err) {
      console.error(
        "Reports loading error:",
        err
      );

      setError(
        "Unable to load your reports."
      );
    } finally {
      setReportsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/citizen/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Unable to logout.");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "resolved":
        return "bg-success";

      case "work_started":
        return "bg-primary";

      case "under_verification":
        return "bg-warning text-dark";

      default:
        return "bg-secondary";
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" />
        <p className="mt-3">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            Welcome,{" "}
            {profile?.fullName ||
              user?.displayName ||
              "Citizen"}
          </h1>

          <p className="text-muted mb-0">
            Citizen Infrastructure Dashboard
          </p>
        </div>

        <button
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="row g-3 mb-5">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h4>Report Now</h4>

              <p className="text-muted">
                Report an infrastructure issue happening
                right now using your current location and
                camera evidence.
              </p>

              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate("/citizen/report")
                }
              >
                Report Now
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h4>Report Something I Saw</h4>

              <p className="text-muted">
                Report an infrastructure problem you
                noticed earlier.
              </p>

              <button
                className="btn btn-dark"
                onClick={() =>
                  navigate(
                    "/citizen/report-something"
                  )
                }
              >
                Report Something I Saw
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="mb-1">
                My Reports
              </h3>

              <p className="text-muted mb-0">
                Reports submitted from your account.
              </p>
            </div>

            <span className="badge bg-dark">
              {reports.length} Report
              {reports.length !== 1 ? "s" : ""}
            </span>
          </div>

          {reportsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border" />
            </div>
          ) : reports.length === 0 ? (
            <div className="alert alert-light border">
              You haven't submitted any reports yet.
            </div>
          ) : (
            <div className="row g-3">
              {reports.map((report) => (
                <div
                  className="col-md-6"
                  key={report.id}
                >
                  <div className="card border h-100">
                    {report.evidence?.imageUrl && (
                      <img
                        src={report.evidence.imageUrl}
                        alt="Report evidence"
                        className="card-img-top"
                        style={{
                          height: "200px",
                          objectFit: "cover",
                        }}
                      />
                    )}

                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">
                          {report.category}
                        </h5>

                        <span
                          className={`badge ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {report.status ||
                            "reported"}
                        </span>
                      </div>

                      <p className="card-text">
                        {report.description}
                      </p>

                      <small className="text-muted">
                        Type:{" "}
                        {report.reportType ===
                        "report-now"
                          ? "Report Now"
                          : "Report Something I Saw"}
                      </small>

                      {report.location && (
                        <div className="mt-2">
                          {report.location.latitude && (
                            <small className="text-muted d-block">
                              Latitude:{" "}
                              {report.location.latitude}
                            </small>
                          )}

                          {report.location.longitude && (
                            <small className="text-muted d-block">
                              Longitude:{" "}
                              {report.location.longitude}
                            </small>
                          )}

                          {report.location
                            .approximateLocation && (
                            <small className="text-muted d-block">
                              Location:{" "}
                              {
                                report.location
                                  .approximateLocation
                              }
                            </small>
                          )}
                        </div>
                      )}

                      <div className="mt-3">
                        <small className="text-muted">
                          AI Check:{" "}
                          {report.aiAnalysis
                            ?.checked
                            ? `${report.aiAnalysis.matchScore}%`
                            : "Pending"}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
  <div className="card-body">

    <h4>My Profile</h4>

    <hr />

    <p>
      <strong>Name:</strong>{" "}
      {profile?.fullName ||
  "Citizen"}
    </p>

    <p>
      <strong>Email:</strong>{" "}
      {profile?.email ||
        "Not available"}
    </p>

    <p>
      <strong>Phone:</strong>{" "}
      {profile?.phoneNumber ||
        "Not available"}
    </p>

    <p className="mb-0">
      <strong>Account Type:</strong>{" "}
      Citizen
    </p>

  </div>
</div>
    </div>
  );
}

export default CitizenDashboard;