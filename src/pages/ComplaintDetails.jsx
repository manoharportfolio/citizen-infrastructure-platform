import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getPublicReportById
} from "../services/publicReportService";

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPublicReportById(id);

      setReport(data);
    } catch (err) {
      console.error(
        "Complaint details error:",
        err
      );

      setError(
        err.message ||
          "Unable to load complaint."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="complaint-details-page">
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
              Loading complaint...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="complaint-details-page">
        <div className="container py-5">

          <button
            type="button"
            className="btn btn-outline-secondary mb-4"
            onClick={handleBack}
          >
            ← Back
          </button>

          <div className="alert alert-danger">
            <h1 className="h5 fw-bold">
              Unable to load complaint
            </h1>

            <p className="mb-3">
              {error ||
                "Complaint not found."}
            </p>

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={loadReport}
              >
                Try Again
              </button>

              <Link
                to="/explore"
                className="btn btn-danger"
              >
                Explore Complaints
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const confidence =
    report.aiAnalysis
      ?.confidence;

  return (
    <div className="complaint-details-page">
      <div className="container py-4 py-md-5">

        {/* Back button */}
        <button
          type="button"
          className="btn btn-outline-secondary mb-4"
          onClick={handleBack}
        >
          ← Back
        </button>

        {/* Header */}
        <div className="row g-4">

          {/* Main content */}
          <div className="col-12 col-lg-8">

            <div className="card border-0 shadow-sm mb-4">

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
                    maxHeight: "500px",
                    objectFit: "cover"
                  }}
                />
              )}

              <div className="card-body p-4">

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge text-bg-primary">
                    {report.category ||
                      "Other"}
                  </span>

                  <span className="badge text-bg-light border">
                    {formatStatus(
                      report.status
                    )}
                  </span>

                  {report.aiAnalysis
                    ?.checked && (
                    <span className="badge text-bg-success">
                      AI analyzed
                    </span>
                  )}
                </div>

                <h1 className="h2 fw-bold mb-3">
                  {report.description ||
                    "No description provided."}
                </h1>

                <div className="text-secondary mb-4">
                  {formatLocation(
                    report.location
                  )}
                </div>

                <hr />

                <div className="row g-4 mt-1">

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
                    label="Area"
                    value={
                      report.location
                        ?.area ||
                      "Not available"
                    }
                  />

                  <InfoItem
                    label="City"
                    value={
                      report.location
                        ?.city ||
                      "Not available"
                    }
                  />

                </div>
              </div>
            </div>

            {/* AI analysis */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
                  <div>
                    <div className="text-primary small fw-bold text-uppercase mb-1">
                      AI analysis
                    </div>

                    <h2 className="h4 fw-bold mb-0">
                      Evidence Analysis
                    </h2>
                  </div>

                  {report.aiAnalysis
                    ?.checked ? (
                    <span className="badge text-bg-success">
                      Analyzed
                    </span>
                  ) : (
                    <span className="badge text-bg-secondary">
                      Pending
                    </span>
                  )}
                </div>

                {report.aiAnalysis
                  ?.checked ? (
                  <>
                    <div className="row g-3 mb-4">

                      <div className="col-12 col-md-6">
                        <div className="bg-light rounded-3 p-3">
                          <div className="text-secondary small mb-1">
                            Detected issue
                          </div>

                          <div className="fw-semibold">
                            {report.aiAnalysis
                              ?.detectedIssue ||
                              "Not available"}
                          </div>
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="bg-light rounded-3 p-3">
                          <div className="text-secondary small mb-1">
                            Suggested category
                          </div>

                          <div className="fw-semibold">
                            {report.aiAnalysis
                              ?.suggestedCategory ||
                              report.category ||
                              "Not available"}
                          </div>
                        </div>
                      </div>

                    </div>

                    {confidence !==
                      undefined && (
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">
                            Evidence confidence
                          </span>

                          <span className="fw-bold text-primary">
                            {confidence}%
                          </span>
                        </div>

                        <div
                          className="progress"
                          style={{
                            height: "8px"
                          }}
                        >
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  Number(
                                    confidence
                                  ) || 0,
                                  0
                                ),
                                100
                              )}%`
                            }}
                          ></div>
                        </div>

                        <p className="small text-secondary mt-2 mb-0">
                          This indicates how
                          consistent the
                          available evidence is
                          with the reported issue.
                          It does not prove that the
                          complaint is true.
                        </p>
                      </div>
                    )}

                    {report.aiAnalysis
                      ?.observations
                      ?.length > 0 && (
                      <div>
                        <h3 className="h6 fw-bold mb-3">
                          AI observations
                        </h3>

                        <ul className="mb-0">
                          {report.aiAnalysis.observations.map(
                            (
                              observation,
                              index
                            ) => (
                              <li
                                key={index}
                                className="mb-2 text-secondary"
                              >
                                {observation}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-secondary mb-0">
                    AI analysis is not available
                    for this complaint yet.
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">

                <h2 className="h4 fw-bold mb-4">
                  Location
                </h2>

                <div className="row g-3">

                  <InfoItem
                    label="State"
                    value={
                      report.location
                        ?.state ||
                      "Not available"
                    }
                  />

                  <InfoItem
                    label="District"
                    value={
                      report.location
                        ?.district ||
                      "Not available"
                    }
                  />

                  <InfoItem
                    label="Latitude"
                    value={
                      report.location
                        ?.latitude ??
                      "Not available"
                    }
                  />

                  <InfoItem
                    label="Longitude"
                    value={
                      report.location
                        ?.longitude ??
                      "Not available"
                    }
                  />

                  <InfoItem
                    label="GPS accuracy"
                    value={
                      report.location
                        ?.accuracy
                        ? `${report.location.accuracy} m`
                        : "Not available"
                    }
                  />

                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-12 col-lg-4">

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">

                <h2 className="h5 fw-bold mb-3">
                  Explore this area
                </h2>

                <p className="text-secondary small">
                  See other complaints reported
                  around the same area.
                </p>

                {report.location
                  ?.area ? (
                  <Link
                    to={`/area/${encodeURIComponent(
                      report.location.area
                    )}`}
                    className="btn btn-outline-primary w-100"
                  >
                    View Area Intelligence
                  </Link>
                ) : (
                  <Link
                    to="/explore"
                    className="btn btn-outline-primary w-100"
                  >
                    Explore Complaints
                  </Link>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">

                <h2 className="h5 fw-bold mb-3">
                  Report an issue
                </h2>

                <p className="text-secondary small">
                  See a problem in your area?
                  Submit a complaint with
                  evidence.
                </p>

                <Link
                  to="/citizen/report-now"
                  className="btn btn-primary w-100"
                >
                  Report an Issue
                </Link>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   COMPONENTS / HELPERS
========================================================= */

function InfoItem({
  label,
  value
}) {
  return (
    <div className="col-12 col-sm-6">
      <div className="text-secondary small mb-1">
        {label}
      </div>

      <div className="fw-semibold">
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

  return (
    reportType ||
    "Complaint"
  );
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


export default ComplaintDetails;