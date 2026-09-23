import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicReports } from "../services/publicReportService";

function AreaIntelligence() {
  const { areaName } = useParams();

  const decodedAreaName = decodeURIComponent(
    areaName || ""
  );

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAreaReports() {
      try {
        setLoading(true);
        setError("");

        const data = await getPublicReports({
          area: decodedAreaName
        });

        setReports(data.reports || []);
      } catch (err) {
        console.error(
          "Area intelligence error:",
          err
        );

        setError(
          err.message ||
            "Unable to load area intelligence."
        );
      } finally {
        setLoading(false);
      }
    }

    if (decodedAreaName) {
      loadAreaReports();
    } else {
      setLoading(false);
      setError("Area name is missing.");
    }
  }, [decodedAreaName]);

  /* =====================================================
     CATEGORY STATISTICS
  ===================================================== */

  const categoryStats = useMemo(() => {
    const stats = {};

    reports.forEach((report) => {
      const category =
        report.category ||
        "Other";

      stats[category] =
        (stats[category] || 0) + 1;
    });

    return Object.entries(stats).sort(
      (a, b) => b[1] - a[1]
    );
  }, [reports]);

  /* =====================================================
     LOCATION INFORMATION
  ===================================================== */

  const locationInfo =
    reports[0]?.location || {};

  const topCategory =
    categoryStats.length > 0
      ? categoryStats[0]
      : null;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">

          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            ></div>

            <p className="text-secondary mt-3 mb-0">
              Loading area intelligence...
            </p>

          </div>

        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error) {
    return (
      <div className="bg-light min-vh-100">
        <div className="container py-5">

          <div className="alert alert-danger">
            <h5 className="alert-heading">
              Unable to load area
            </h5>

            <p className="mb-3">
              {error}
            </p>

            <Link
              to="/explore"
              className="btn btn-outline-danger"
            >
              ← Back to Complaints
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="area-intelligence-page">

      <div className="container py-4 py-lg-5">

        {/* =================================================
            BACK
        ================================================= */}

        <div className="mb-4">
          <Link
            to="/explore"
            className="text-decoration-none"
          >
            ← Back to complaints
          </Link>
        </div>


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="row align-items-end g-4 mb-5">

          <div className="col-lg-8">

            <span className="badge text-bg-primary mb-3">
              AREA INTELLIGENCE
            </span>

            <h1 className="display-5 fw-bold mb-3">
              {decodedAreaName}
            </h1>

            <p className="lead text-secondary mb-2">
              Complaint intelligence based on
              citizen reports submitted in this area.
            </p>

            <div className="text-secondary">

              {locationInfo.city && (
                <span>
                  {locationInfo.city}
                </span>
              )}

              {locationInfo.district && (
                <span>
                  {locationInfo.city
                    ? " • "
                    : ""}
                  {locationInfo.district}
                </span>
              )}

              {locationInfo.state && (
                <span>
                  {locationInfo.city ||
                  locationInfo.district
                    ? " • "
                    : ""}
                  {locationInfo.state}
                </span>
              )}

            </div>

          </div>

          <div className="col-lg-4 text-lg-end">

            <Link
              to="/citizen/report-now"
              className="btn btn-primary"
            >
              Report an Issue →
            </Link>

          </div>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="row g-3 mb-5">

          {/* TOTAL */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <small className="text-secondary">
                  TOTAL REPORTS
                </small>

                <div className="display-6 fw-bold mt-2">
                  {reports.length}
                </div>

                <small className="text-secondary">
                  Citizen reports in this area
                </small>

              </div>
            </div>
          </div>


          {/* CATEGORIES */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <small className="text-secondary">
                  CATEGORIES
                </small>

                <div className="display-6 fw-bold mt-2">
                  {categoryStats.length}
                </div>

                <small className="text-secondary">
                  Types of reported problems
                </small>

              </div>
            </div>
          </div>


          {/* TOP CATEGORY */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <small className="text-secondary">
                  MOST REPORTED
                </small>

                <div className="fs-4 fw-bold mt-3">
                  {topCategory
                    ? topCategory[0]
                    : "None"}
                </div>

                <small className="text-secondary">
                  {topCategory
                    ? `${topCategory[1]} reports`
                    : "No reports yet"}
                </small>

              </div>
            </div>
          </div>


          {/* STATUS */}
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">

                <small className="text-secondary">
                  AREA STATUS
                </small>

                <div className="fs-4 fw-bold mt-3">
                  {reports.length > 0
                    ? "Reports Found"
                    : "No Reports"}
                </div>

                <small className="text-secondary">
                  Based on public citizen reports
                </small>

              </div>
            </div>
          </div>

        </div>


        {/* =================================================
            CATEGORY BREAKDOWN + AREA SUMMARY
        ================================================= */}

        <div className="row g-4 mb-5">

          {/* CATEGORY BREAKDOWN */}
          <div className="col-lg-7">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-header bg-white py-3">

                <h5 className="mb-1">
                  Complaint Categories
                </h5>

                <small className="text-secondary">
                  Distribution of reported problems
                  in this area.
                </small>

              </div>

              <div className="card-body">

                {categoryStats.length ===
                0 ? (
                  <div className="text-center py-5">

                    <div className="fs-1 mb-3">
                      📊
                    </div>

                    <h6>
                      No category data
                    </h6>

                    <p className="text-secondary mb-0">
                      Category information will
                      appear when complaints are
                      submitted.
                    </p>

                  </div>
                ) : (
                  categoryStats.map(
                    ([category, count]) => {

                      const percentage =
                        reports.length > 0
                          ? Math.round(
                              (count /
                                reports.length) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={category}
                          className="mb-4"
                        >

                          <div className="d-flex justify-content-between align-items-center mb-2">

                            <span className="fw-semibold">
                              {category}
                            </span>

                            <span className="text-secondary small">
                              {count}{" "}
                              {count === 1
                                ? "report"
                                : "reports"}
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
                                width: `${percentage}%`
                              }}
                              aria-valuenow={
                                percentage
                              }
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>

                          <small className="text-secondary">
                            {percentage}% of
                            complaints
                          </small>

                        </div>
                      );
                    }
                  )
                )}

              </div>
            </div>

          </div>


          {/* AREA SUMMARY */}
          <div className="col-lg-5">

            <div className="card border-0 shadow-sm h-100">

              <div className="card-header bg-white py-3">
                <h5 className="mb-1">
                  Area Summary
                </h5>

                <small className="text-secondary">
                  Location information from
                  citizen reports.
                </small>
              </div>

              <div className="card-body">

                <InfoRow
                  label="AREA"
                  value={
                    decodedAreaName ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="CITY"
                  value={
                    locationInfo.city ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="DISTRICT"
                  value={
                    locationInfo.district ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="STATE"
                  value={
                    locationInfo.state ||
                    "Not available"
                  }
                />

                <InfoRow
                  label="TOTAL REPORTS"
                  value={reports.length}
                  last
                />

              </div>
            </div>

          </div>

        </div>


        {/* =================================================
            REPORTS
        ================================================= */}

        <section>

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">

            <div>
              <h3 className="mb-1">
                Reports from{" "}
                {decodedAreaName}
              </h3>

              <p className="text-secondary mb-0">
                Citizen complaints contributing
                to this area's public intelligence.
              </p>
            </div>

            <span className="text-secondary small">
              {reports.length}{" "}
              {reports.length === 1
                ? "report"
                : "reports"}
            </span>

          </div>


          {reports.length === 0 ? (
            <div className="card border-0 shadow-sm">

              <div className="card-body text-center py-5">

                <div className="fs-1 mb-3">
                  📍
                </div>

                <h4>
                  No complaints found
                </h4>

                <p className="text-secondary">
                  There are currently no public
                  complaints for this area.
                </p>

                <Link
                  to="/citizen/report-now"
                  className="btn btn-primary"
                >
                  Report an Issue
                </Link>

              </div>

            </div>
          ) : (
            <div className="row g-4">

              {reports.map((report) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={report.id}
                >

                  <div className="card border-0 shadow-sm h-100">

                    {/* EVIDENCE IMAGE */}
                    {report.evidence
                      ?.imageUrl && (
                      <img
                        src={
                          report.evidence
                            .imageUrl
                        }
                        alt={
                          report.category ||
                          "Complaint evidence"
                        }
                        className="card-img-top"
                        style={{
                          height:
                            "200px",
                          objectFit:
                            "cover"
                        }}
                      />
                    )}

                    <div className="card-body d-flex flex-column">

                      <div className="d-flex flex-wrap gap-2 mb-2">

                        <span className="badge text-bg-primary">
                          {report.category ||
                            "Infrastructure Issue"}
                        </span>

                        {report.aiAnalysis
                          ?.checked && (
                          <span className="badge text-bg-success">
                            AI analyzed
                          </span>
                        )}

                      </div>

                      <h5 className="card-title">
                        {report.description ||
                          "Citizen complaint"}
                      </h5>

                      <p className="text-secondary small mb-3">
                        {report.location
                          ?.area ||
                          decodedAreaName}

                        {report.location
                          ?.city
                          ? `, ${report.location.city}`
                          : ""}
                      </p>

                      {report.aiAnalysis
                        ?.confidence !==
                        undefined && (
                        <div className="mb-3">

                          <small className="text-secondary">
                            Evidence confidence
                          </small>

                          <div className="fw-semibold">
                            {Math.round(
                              report
                                .aiAnalysis
                                .confidence *
                                100
                            )}
                            %
                          </div>

                        </div>
                      )}

                      <div className="mt-auto">

                        <Link
                          to={`/complaint/${report.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          View Complaint
                        </Link>

                      </div>

                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

        </section>


        {/* =================================================
            CTA
        ================================================= */}

        <div className="card border-0 bg-primary text-white mt-5">

          <div className="card-body p-4 p-lg-5">

            <div className="row align-items-center g-4">

              <div className="col-lg-8">

                <h4 className="fw-bold mb-2">
                  Seen another problem in{" "}
                  {decodedAreaName}?
                </h4>

                <p className="mb-0 opacity-75">
                  Submit a report and contribute
                  to the public picture of
                  infrastructure problems in
                  your area.
                </p>

              </div>

              <div className="col-lg-4 text-lg-end">

                <Link
                  to="/citizen/report-now"
                  className="btn btn-light"
                >
                  Report an Issue →
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
   SMALL REUSABLE INFORMATION ROW
========================================================= */

function InfoRow({
  label,
  value,
  last = false
}) {
  return (
    <div
      className={
        last
          ? "mb-0"
          : "mb-3 pb-3 border-bottom"
      }
    >
      <small className="text-secondary d-block">
        {label}
      </small>

      <div className="fw-semibold mt-1">
        {value}
      </div>
    </div>
  );
}

export default AreaIntelligence;