import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteReport,
  getMyReports
} from "../services/reportService";

function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getMyReports();

      setReports(
        data.reports || []
      );
    } catch (err) {
      console.error(
        "My reports error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    reportId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this complaint?\n\nThis will remove it from your complaints and from the public complaint map."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(reportId);
      setError("");
      setSuccess("");

      await deleteReport(
        reportId
      );

      /*
       * Remove it immediately from
       * the current list.
       */
      setReports(
        (currentReports) =>
          currentReports.filter(
            (report) =>
              report.id !== reportId
          )
      );

      setSuccess(
        "Complaint deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete complaint error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete complaint."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">
          <div className="text-center py-5">
            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <p className="text-secondary mt-3 mb-0">
              Loading your complaints...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-5">

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="text-primary small fw-bold text-uppercase mb-2">
              Citizen account
            </div>

            <h1 className="h2 fw-bold mb-2">
              My Complaints
            </h1>

            <p className="text-secondary mb-0">
              View and manage the complaints
              you have submitted.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/citizen/report-now"
              className="btn btn-primary"
            >
              Report an Issue
            </Link>

            <Link
              to="/explore"
              className="btn btn-outline-secondary"
            >
              Explore
            </Link>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div
            className="alert alert-success alert-dismissible"
            role="alert"
          >
            {success}

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setSuccess("")
              }
            ></button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="alert alert-danger alert-dismissible"
            role="alert"
          >
            {error}

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setError("")
              }
            ></button>
          </div>
        )}

        {/* Statistics */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-secondary small mb-1">
                  Total complaints
                </div>

                <div className="display-6 fw-bold">
                  {reports.length}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-secondary small mb-1">
                  AI analyzed
                </div>

                <div className="display-6 fw-bold">
                  {
                    reports.filter(
                      (report) =>
                        report.aiAnalysis
                          ?.checked
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-secondary small mb-1">
                  Reported
                </div>

                <div className="display-6 fw-bold">
                  {
                    reports.filter(
                      (report) =>
                        report.status ===
                        "reported"
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No reports */}
        {reports.length === 0 ? (
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5 px-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3"
                style={{
                  width: "64px",
                  height: "64px",
                  fontSize: "28px"
                }}
              >
                +
              </div>

              <h2 className="h4 fw-bold">
                No complaints yet
              </h2>

              <p className="text-secondary mx-auto mb-4" style={{ maxWidth: "520px" }}>
                You haven't submitted any
                complaints yet. Report an
                infrastructure problem and
                help make local issues visible.
              </p>

              <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                <Link
                  to="/citizen/report-now"
                  className="btn btn-primary"
                >
                  Report Now
                </Link>

                <Link
                  to="/citizen/report-something"
                  className="btn btn-outline-primary"
                >
                  Report Something I Saw
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {reports.map((report) => (
              <div
                className="col-12 col-lg-6"
                key={report.id}
              >
                <div className="card border-0 shadow-sm h-100">

                  {/* Evidence image */}
                  {report.evidence
                    ?.imageUrl && (
                    <img
                      src={
                        report.evidence
                          .imageUrl
                      }
                      alt="Complaint evidence"
                      className="card-img-top"
                      style={{
                        height: "220px",
                        objectFit: "cover"
                      }}
                    />
                  )}

                  <div className="card-body p-4">

                    {/* Category + status */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                      <span className="badge text-bg-primary">
                        {report.category ||
                          "Other"}
                      </span>

                      <span className="badge text-bg-light border">
                        {formatStatus(
                          report.status
                        )}
                      </span>
                    </div>

                    {/* Description */}
                    <h2 className="h5 fw-bold mb-2">
                      {report.description ||
                        "No description provided."}
                    </h2>

                    {/* Location */}
                    <p className="text-secondary mb-3">
                      {formatLocation(
                        report.location
                      )}
                    </p>

                    {/* Details */}
                    <div className="border-top pt-3">

                      <div className="row g-3 small">

                        <InfoItem
                          label="Report type"
                          value={formatReportType(
                            report.reportType
                          )}
                        />

                        <InfoItem
                          label="Submitted"
                          value={formatDate(
                            report.createdAt
                          )}
                        />

                        <InfoItem
                          label="AI analysis"
                          value={
                            report.aiAnalysis
                              ?.checked
                              ? "Analyzed"
                              : "Pending"
                          }
                        />

                        <InfoItem
                          label="Evidence confidence"
                          value={
                            report.aiAnalysis
                              ?.confidence !==
                            undefined
                              ? `${report.aiAnalysis.confidence}%`
                              : "Not available"
                          }
                        />

                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="card-footer bg-white border-0 pt-0 px-4 pb-4">
                    <div className="d-flex flex-column flex-sm-row gap-2">

                      <Link
                        to={`/complaint/${report.id}`}
                        className="btn btn-outline-primary flex-grow-1"
                      >
                        View Complaint
                      </Link>

                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() =>
                          handleDelete(
                            report.id
                          )
                        }
                        disabled={
                          deletingId ===
                          report.id
                        }
                      >
                        {deletingId ===
                        report.id ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>

                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}


/* =========================================================
   SMALL COMPONENTS / HELPERS
========================================================= */

function InfoItem({
  label,
  value
}) {
  return (
    <div className="col-12 col-sm-6">
      <div className="text-secondary mb-1">
        {label}
      </div>

      <div className="fw-semibold text-dark">
        {value}
      </div>
    </div>
  );
}


function formatLocation(
  location
) {
  if (!location) {
    return "Location not available";
  }

  const parts = [
    location.area,
    location.city,
    location.district,
    location.state
  ].filter(Boolean);

  return (
    parts.join(", ") ||
    "Location not available"
  );
}


function formatReportType(
  reportType
) {
  if (
    reportType ===
    "report-now"
  ) {
    return "Report Now";
  }

  if (
    reportType ===
    "report-something"
  ) {
    return "Report Something I Saw";
  }

  return reportType || "Complaint";
}


function formatStatus(
  status
) {
  if (!status) {
    return "Reported";
  }

  return status
    .replace(
      /[-_]/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function formatDate(
  timestamp
) {
  if (!timestamp) {
    return "Unknown";
  }

  try {
    let date;

    if (
      timestamp?.seconds
    ) {
      date = new Date(
        timestamp.seconds *
          1000
      );
    } else if (
      timestamp?._seconds
    ) {
      date = new Date(
        timestamp._seconds *
          1000
      );
    } else {
      date = new Date(
        timestamp
      );
    }

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );
  } catch {
    return "Unknown";
  }
}


export default MyReports;