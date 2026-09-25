import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getPublicReportById,
} from "../services/publicReportService";


function ComplaintDetails() {
  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();


  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==================================================
  // LOAD COMPLAINT
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const loadReport =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getPublicReportById(
              id
            );

          if (mounted) {
            setReport(data);
          }
        } catch (err) {
          console.error(
            "Load complaint error:",
            err
          );

          if (mounted) {
            setError(
              err.message ||
                "Unable to load complaint."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    if (id) {
      loadReport();
    }

    return () => {
      mounted = false;
    };
  }, [id]);


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="container py-5">

        <div className="row justify-content-center">

          <div className="col-lg-8">

            <div className="card border-0 shadow-sm">

              <div className="card-body p-5 text-center">

                <div
                  className="spinner-border text-primary mb-3"
                  role="status"
                />

                <p className="text-secondary mb-0">
                  Loading complaint...
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error || !report) {
    return (
      <div className="container py-5">

        <div className="row justify-content-center">

          <div className="col-lg-7">

            <div className="card border-0 shadow-sm">

              <div className="card-body p-5 text-center">

                <div
                  className="mb-3"
                  style={{
                    fontSize: "48px",
                  }}
                >
                  ⚠️
                </div>

                <h2 className="h4 fw-bold">
                  Complaint not found
                </h2>

                <p className="text-secondary">
                  {error ||
                    "This complaint could not be found."}
                </p>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  ← Back
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // NORMALIZE DATA
  // ==================================================

  const location =
    report.location || {};

  const evidence =
    report.evidence || {};

  const aiAnalysis =
    report.aiAnalysis || {};


  /*
   * Support the new standardized AI structure.
   *
   * Also support older records that may have
   * used imageDetectedIssue / visualConfidence.
   */

  const detectedIssue =
    aiAnalysis.detectedIssue ||
    aiAnalysis.imageDetectedIssue ||
    "";

  const suggestedCategory =
    aiAnalysis.suggestedCategory ||
    report.category ||
    "";

  const confidence =
    Number(
      aiAnalysis.confidence ??
        aiAnalysis.visualConfidence ??
        0
    );

  const observations =
    Array.isArray(
      aiAnalysis.observations
    )
      ? aiAnalysis.observations
      : [];


  const categoryMatch =
    aiAnalysis.categoryMatch;

  const descriptionMatch =
    aiAnalysis.descriptionMatch;

  const consistencyScore =
    aiAnalysis.consistencyScore ??
    null;

  const aiReason =
    aiAnalysis.reason ||
    "";


  // ==================================================
  // REPORT TYPE
  // ==================================================

  const isReportNow =
    report.reportType ===
    "report-now";


  const reportTypeLabel =
    isReportNow
      ? "Report Now"
      : "Report Something I Saw";


  // ==================================================
  // DATE
  // ==================================================

  const createdDate =
    report.createdAt
      ? new Date(
          report.createdAt
        ).toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        )
      : "Not available";


  const observationDate =
    report.observationDate ||
    report.observation?.date ||
    "";

  const observationTime =
    report.observationTime ||
    report.observation?.time ||
    "";


  // ==================================================
  // LOCATION TEXT
  // ==================================================

  const area =
    location.area ||
    "";

  const city =
    location.city ||
    "";

  const district =
    location.district ||
    "";

  const state =
    location.state ||
    "";


  const locationParts = [
    area,
    city,
    district,
    state,
  ].filter(Boolean);


  const locationText =
    locationParts.length > 0
      ? locationParts.join(
          ", "
        )
      : location.approximateLocation ||
        "Not available";


  // ==================================================
  // GPS
  // ==================================================

  const hasGps =
    typeof location.latitude ===
      "number" &&
    typeof location.longitude ===
      "number";


  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="bg-light min-vh-100">

      <div className="container py-4 py-md-5">

        {/* ============================================
            BACK
        ============================================ */}

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-4"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back
        </button>


        <div className="row g-4">

          {/* ==========================================
              MAIN CONTENT
          ========================================== */}

          <div className="col-12 col-lg-8">

            {/* ========================================
                COMPLAINT HEADER
            ======================================== */}

            <div className="card border-0 shadow-sm mb-4 overflow-hidden">

              {/* EVIDENCE IMAGE */}

              {evidence.hasImage &&
                evidence.imageUrl && (

                  <div
                    className="bg-dark"
                    style={{
                      width: "100%",
                    }}
                  >

                    <img
                      src={
                        evidence.imageUrl
                      }
                      alt={
                        detectedIssue ||
                        report.description ||
                        "Complaint evidence"
                      }
                      className="w-100"
                      style={{
                        display: "block",
                        maxHeight:
                          "520px",
                        objectFit:
                          "cover",
                      }}
                    />

                  </div>
                )}


              <div className="card-body p-4">

                {/* BADGES */}

                <div className="d-flex flex-wrap gap-2 mb-3">

                  <span className="badge text-bg-primary">
                    {report.category ||
                      "Other"}
                  </span>


                  <span className="badge text-bg-light border">
                    {reportTypeLabel}
                  </span>


                  <span className="badge text-bg-success">
                    {report.status ||
                      "Reported"}
                  </span>

                </div>


                {/* TITLE */}

                <h1 className="h3 fw-bold mb-2">

                  {report.description ||
                    detectedIssue ||
                    "Citizen complaint"}

                </h1>


                {/* LOCATION */}

                <div className="text-secondary small">

                  📍 {locationText}

                </div>


                <hr className="my-4" />


                {/* REPORT INFORMATION */}

                <div className="row g-4">

                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      Report type
                    </div>

                    <div className="fw-semibold">
                      {reportTypeLabel}
                    </div>

                  </div>


                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      Submitted
                    </div>

                    <div className="fw-semibold">
                      {createdDate}
                    </div>

                  </div>


                  {observationDate && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        Observed date
                      </div>

                      <div className="fw-semibold">
                        {observationDate}
                      </div>

                    </div>
                  )}


                  {observationTime && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        Observed time
                      </div>

                      <div className="fw-semibold">
                        {observationTime}
                      </div>

                    </div>
                  )}


                  {area && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        Area
                      </div>

                      <div className="fw-semibold">
                        {area}
                      </div>

                    </div>
                  )}


                  {city && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        City
                      </div>

                      <div className="fw-semibold">
                        {city}
                      </div>

                    </div>
                  )}


                  {district && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        District
                      </div>

                      <div className="fw-semibold">
                        {district}
                      </div>

                    </div>
                  )}


                  {state && (
                    <div className="col-md-6">

                      <div className="text-secondary small mb-1">
                        State
                      </div>

                      <div className="fw-semibold">
                        {state}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>


            {/* ========================================
                AI ANALYSIS
            ======================================== */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <div className="d-flex justify-content-between align-items-center gap-3 mb-4">

                  <div>

                    <div className="text-primary small fw-bold text-uppercase mb-1">
                      AI Analysis
                    </div>

                    <h2 className="h5 fw-bold mb-0">
                      Evidence Analysis
                    </h2>

                  </div>


                  {aiAnalysis.checked ? (

                    <span className="badge text-bg-success">
                      Analyzed
                    </span>

                  ) : (

                    <span className="badge text-bg-secondary">
                      Not analyzed
                    </span>
                  )}

                </div>


                {aiAnalysis.checked ? (

                  <>

                    {/* DETECTED ISSUE */}

                    <div className="bg-light rounded p-3 mb-3">

                      <div className="text-secondary small mb-1">
                        Detected issue
                      </div>

                      <div className="fw-semibold">

                        {detectedIssue ||
                          "AI could not determine a specific issue."}

                      </div>

                    </div>


                    {/* SUGGESTED CATEGORY */}

                    <div className="bg-light rounded p-3 mb-3">

                      <div className="text-secondary small mb-1">
                        Suggested category
                      </div>

                      <div className="fw-semibold">

                        {suggestedCategory ||
                          "Not available"}

                      </div>

                    </div>


                    {/* CONFIDENCE */}

                    <div className="bg-light rounded p-3 mb-3">

                      <div className="d-flex justify-content-between align-items-center mb-2">

                        <div className="text-secondary small">
                          Evidence confidence
                        </div>

                        <div className="fw-bold text-primary">
                          {confidence}%
                        </div>

                      </div>


                      <div
                        className="progress"
                        style={{
                          height: "8px",
                        }}
                      >

                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                confidence,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>


                    {/* CONSISTENCY */}

                    {(categoryMatch !==
                      undefined ||
                      descriptionMatch !==
                        undefined ||
                      consistencyScore !==
                        null) && (

                      <div className="bg-light rounded p-3 mb-3">

                        <div className="fw-semibold mb-3">
                          Complaint consistency
                        </div>


                        {categoryMatch !==
                          undefined && (

                          <div className="d-flex justify-content-between mb-2">

                            <span className="text-secondary">
                              Category match
                            </span>

                            <span className="fw-semibold">

                              {categoryMatch
                                ? "✓ Match"
                                : "✗ Not matched"}

                            </span>

                          </div>
                        )}


                        {descriptionMatch !==
                          undefined && (

                          <div className="d-flex justify-content-between mb-2">

                            <span className="text-secondary">
                              Description match
                            </span>

                            <span className="fw-semibold">

                              {descriptionMatch
                                ? "✓ Match"
                                : "✗ Not matched"}

                            </span>

                          </div>
                        )}


                        {consistencyScore !==
                          null && (

                          <div className="d-flex justify-content-between">

                            <span className="text-secondary">
                              Consistency score
                            </span>

                            <span className="fw-bold">
                              {
                                consistencyScore
                              }%
                            </span>

                          </div>
                        )}

                      </div>
                    )}


                    {/* AI REASON */}

                    {aiReason && (

                      <div className="alert alert-light border mb-3">

                        <div className="small fw-semibold mb-1">
                          AI reasoning
                        </div>

                        <div className="small text-secondary">
                          {aiReason}
                        </div>

                      </div>
                    )}


                    {/* OBSERVATIONS */}

                    {observations.length >
                      0 && (

                      <div>

                        <div className="fw-semibold mb-2">
                          AI observations
                        </div>

                        <ul className="small text-secondary mb-0 ps-3">

                          {observations.map(
                            (
                              observation,
                              index
                            ) => (

                              <li
                                key={
                                  index
                                }
                                className="mb-1"
                              >
                                {observation}
                              </li>

                            )
                          )}

                        </ul>

                      </div>
                    )}


                    <div className="alert alert-info mt-4 mb-0">

                      <small>

                        AI analysis indicates
                        whether the visual
                        evidence appears
                        consistent with the
                        submitted complaint. It
                        does not independently
                        prove that the reported
                        issue is true.

                      </small>

                    </div>

                  </>

                ) : (

                  <div className="alert alert-secondary mb-0">

                    AI evidence analysis is not
                    available for this complaint.

                  </div>
                )}

              </div>

            </div>


            {/* ========================================
                LOCATION
            ======================================== */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <h2 className="h5 fw-bold mb-4">
                  Location
                </h2>


                <div className="row g-4">

                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      State
                    </div>

                    <div className="fw-semibold">
                      {state ||
                        "Not available"}
                    </div>

                  </div>


                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      District
                    </div>

                    <div className="fw-semibold">
                      {district ||
                        "Not available"}
                    </div>

                  </div>


                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      City
                    </div>

                    <div className="fw-semibold">
                      {city ||
                        "Not available"}
                    </div>

                  </div>


                  <div className="col-md-6">

                    <div className="text-secondary small mb-1">
                      Area
                    </div>

                    <div className="fw-semibold">
                      {area ||
                        "Not available"}
                    </div>

                  </div>


                  {hasGps && (

                    <>

                      <div className="col-md-6">

                        <div className="text-secondary small mb-1">
                          Latitude
                        </div>

                        <div className="fw-semibold">
                          {
                            location.latitude
                          }
                        </div>

                      </div>


                      <div className="col-md-6">

                        <div className="text-secondary small mb-1">
                          Longitude
                        </div>

                        <div className="fw-semibold">
                          {
                            location.longitude
                          }
                        </div>

                      </div>


                      <div className="col-md-6">

                        <div className="text-secondary small mb-1">
                          GPS accuracy
                        </div>

                        <div className="fw-semibold">

                          {location.accuracy !=
                          null
                            ? `${Math.round(
                                location.accuracy
                              )} m`
                            : "Not available"}

                        </div>

                      </div>

                    </>
                  )}


                  {!hasGps &&
                    location.approximateLocation && (

                      <div className="col-12">

                        <div className="text-secondary small mb-1">
                          Approximate location
                        </div>

                        <div className="fw-semibold">
                          {
                            location.approximateLocation
                          }
                        </div>

                      </div>
                    )}

                </div>

              </div>

            </div>

          </div>


          {/* ==========================================
              SIDEBAR
          ========================================== */}

          <div className="col-12 col-lg-4">

            {/* AREA */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <h2 className="h6 fw-bold">
                  Explore this area
                </h2>

                <p className="small text-secondary">
                  See other complaints
                  reported around the same
                  area.
                </p>


                {area ? (

                  <Link
                    to={`/area/${encodeURIComponent(
                      area
                    )}`}
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    View Area Intelligence
                  </Link>

                ) : (

                  <Link
                    to="/explore"
                    className="btn btn-outline-primary btn-sm w-100"
                  >
                    Explore Complaints
                  </Link>
                )}

              </div>

            </div>


            {/* REPORT */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <h2 className="h6 fw-bold">
                  Report an issue
                </h2>

                <p className="small text-secondary">
                  See a problem in your area?
                  Submit a complaint with
                  evidence.
                </p>


                <Link
                  to="/citizen/login"
                  className="btn btn-primary btn-sm w-100"
                >
                  Report an Issue
                </Link>

              </div>

            </div>


            {/* EVIDENCE INFORMATION */}

            <div className="card border-0 shadow-sm">

              <div className="card-body p-4">

                <h2 className="h6 fw-bold">
                  Evidence
                </h2>


                {evidence.hasImage &&
                evidence.imageUrl ? (

                  <div>

                    <div className="small text-success mb-2">
                      ✓ Evidence image available
                    </div>

                    <div className="small text-secondary">

                      AI analysis has been
                      performed on the submitted
                      visual evidence.

                    </div>

                  </div>

                ) : (

                  <div className="small text-secondary">
                    No evidence image is available
                    for this complaint.
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


export default ComplaintDetails;