import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  auth
} from "../firebase/config";

import {
  uploadImage
} from "../services/imageService";

import {
  analyzeComplaint
} from "../services/aiService";

import {
  createReport
} from "../services/reportService";


/* =========================================================
   CONSTANTS
========================================================= */

const CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Footpath",
  "Streetlight",
  "Water Supply",
  "Drainage",
  "Public Transport",
  "Traffic Signal",
  "Other"
];


/* =========================================================
   COMPONENT
========================================================= */

function ReportSomething() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */

  const [date, setDate] =
    useState("");

  const [time, setTime] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");


  /* -------------------------------------------------------
     EVIDENCE
  ------------------------------------------------------- */

  const [evidence, setEvidence] =
    useState(null);

  const [imageUrl, setImageUrl] =
    useState("");

  const [imageUploading, setImageUploading] =
    useState(false);


  /* -------------------------------------------------------
     AI
  ------------------------------------------------------- */

  const [aiChecking, setAiChecking] =
    useState(false);

  const [aiImageAnalysis, setAiImageAnalysis] =
    useState(null);

  const [aiVerification, setAiVerification] =
    useState(null);

  const [aiError, setAiError] =
    useState("");


  /* -------------------------------------------------------
     SUBMISSION
  ------------------------------------------------------- */

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [submittedReportId, setSubmittedReportId] =
    useState("");

  const [error, setError] =
    useState("");


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      /*
       * No camera is used in this page.
       *
       * This cleanup exists so the page has no
       * pending async UI timers or background
       * operations added later.
       */
    };
  }, []);


  /* =======================================================
     IMAGE SELECT
  ======================================================= */

  const handleEvidenceChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError("");
      setAiError("");
      setAiImageAnalysis(null);
      setAiVerification(null);

      /* -----------------------------------------------
         Validate file type
      ------------------------------------------------ */

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setError(
          "Please select an image file."
        );

        event.target.value = "";

        return;
      }


      /* -----------------------------------------------
         Validate file size
      ------------------------------------------------ */

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setError(
          "Image size must be less than 5MB."
        );

        event.target.value = "";

        return;
      }


      try {
        setEvidence(file);
        setImageUrl("");

        setImageUploading(true);

        /* ---------------------------------------------
           Upload to ImageKit
        ---------------------------------------------- */

        const uploadedImage =
          await uploadImage(
            file,
            `/citizen-reports/${
              auth.currentUser?.uid ||
              "unknown"
            }/past-reports`
          );

        if (
          !uploadedImage?.url
        ) {
          throw new Error(
            "Image upload succeeded but no image URL was returned."
          );
        }

        setImageUrl(
          uploadedImage.url
        );

        setImageUploading(false);


        /* ---------------------------------------------
           First AI image-only analysis
        ---------------------------------------------- */

        setAiChecking(true);

        const result =
          await analyzeComplaint({
            imageUrl:
              uploadedImage.url,

            category: "",

            description: "",

            mode: "image-only"
          });

        setAiImageAnalysis(
          result?.imageAssessment ||
            null
        );

        setAiChecking(false);

      } catch (err) {
        console.error(
          "Evidence processing error:",
          err
        );

        setImageUploading(false);
        setAiChecking(false);

        setImageUrl("");
        setEvidence(null);

        setError(
          err.message ||
            "Failed to process the evidence."
        );
      }
    };


  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeEvidence =
    () => {
      setEvidence(null);

      setImageUrl("");

      setAiImageAnalysis(
        null
      );

      setAiVerification(
        null
      );

      setAiError("");

      const input =
        document.getElementById(
          "evidenceImage"
        );

      if (input) {
        input.value = "";
      }
    };


  /* =======================================================
     FULL AI CHECK
  ======================================================= */

  const runFullAICheck =
    useCallback(
      async () => {
        if (
          !imageUrl ||
          !category.trim() ||
          !description.trim()
        ) {
          return;
        }

        try {
          setError("");
          setAiError("");

          setAiChecking(true);
          setAiVerification(
            null
          );

          const result =
            await analyzeComplaint({
              imageUrl,

              category:
                category.trim(),

              description:
                description.trim(),

              mode: "full-check"
            });

          const consistency =
            result?.consistency ||
            null;

          setAiVerification(
            consistency
          );

          if (
            !consistency
          ) {
            setAiError(
              "AI did not return a consistency result."
            );
          }

        } catch (err) {
          console.error(
            "AI verification error:",
            err
          );

          setAiError(
            err.message ||
              "AI verification could not be completed."
          );

          setAiVerification(
            null
          );
        } finally {
          setAiChecking(false);
        }
      },
      [
        imageUrl,
        category,
        description
      ]
    );


  /* =======================================================
     AUTOMATIC FINAL AI CHECK
  ======================================================= */

  useEffect(() => {
    if (
      !imageUrl ||
      !category.trim() ||
      !description.trim()
    ) {
      setAiVerification(
        null
      );

      return;
    }

    const timer =
      setTimeout(() => {
        runFullAICheck();
      }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [
    imageUrl,
    category,
    description,
    runFullAICheck
  ]);


  /* =======================================================
     RETRY AI
  ======================================================= */

  const retryAICheck =
    async () => {
      if (!imageUrl) {
        setAiError(
          "Please upload evidence first."
        );

        return;
      }

      await runFullAICheck();
    };


  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setAiError("");

      /* -----------------------------------------------
         Authentication
      ------------------------------------------------ */

      if (!auth.currentUser) {
        setError(
          "You must be logged in to submit a report."
        );

        return;
      }


      /* -----------------------------------------------
         Date
      ------------------------------------------------ */

      if (!date) {
        setError(
          "Please select when you observed the issue."
        );

        return;
      }


      /* -----------------------------------------------
         Time
      ------------------------------------------------ */

      if (!time) {
        setError(
          "Please select the approximate time."
        );

        return;
      }


      /* -----------------------------------------------
         Location
      ------------------------------------------------ */

      if (!location.trim()) {
        setError(
          "Please enter the approximate location."
        );

        return;
      }


      /* -----------------------------------------------
         Category
      ------------------------------------------------ */

      if (!category) {
        setError(
          "Please select an issue category."
        );

        return;
      }


      /* -----------------------------------------------
         Description
      ------------------------------------------------ */

      if (!description.trim()) {
        setError(
          "Please describe the issue."
        );

        return;
      }


      /* -----------------------------------------------
         Evidence
      ------------------------------------------------ */

      if (
        !evidence ||
        !imageUrl
      ) {
        setError(
          "Evidence photo is required."
        );

        return;
      }


      /* -----------------------------------------------
         Processing
      ------------------------------------------------ */

      if (
        imageUploading ||
        aiChecking
      ) {
        setError(
          "Please wait until the evidence processing is complete."
        );

        return;
      }


      /* -----------------------------------------------
         AI
      ------------------------------------------------ */

      if (
        !aiVerification ||
        !aiVerification.approved
      ) {
        setError(
          "The AI consistency check has not passed. Please review the evidence, category, and description."
        );

        return;
      }


      /* -----------------------------------------------
         Submit
      ------------------------------------------------ */

      try {
        setLoading(true);

        /*
         * IMPORTANT:
         *
         * We no longer use addDoc() here.
         *
         * The backend creates:
         *
         * reports/{reportId}
         *
         * and
         *
         * publicReports/{reportId}
         *
         */

        const reportData = {
          reportType:
            "report-something",

          category:
            category.trim(),

          description:
            description.trim(),

          /*
           * Earlier observation date/time.
           */
          observationDate:
            date,

          observationTime:
            time,

          /*
           * Past observations normally do not
           * have current GPS coordinates.
           *
           * We still use a structured location
           * object so the public system can
           * understand it.
           */
          location: {
            state: "",

            city: "",

            district: "",

            /*
             * Store the approximate address/
             * landmark as the area.
             */
            area:
              location.trim(),

            /*
             * No current GPS was requested
             * for this report type.
             */
            latitude: null,

            longitude: null,

            accuracy: null,

            /*
             * Keep the original text too.
             */
            approximateLocation:
              location.trim()
          },

          /*
           * ImageKit evidence.
           */
          evidence: {
            hasImage: true,

            imageUrl:

              imageUrl,

            fileName:
              evidence.name,

            fileType:
              evidence.type
          },

          /*
           * AI analysis.
           */
          aiAnalysis: {
            checked: true,

            detectedIssue:
              aiImageAnalysis
                ?.detectedIssue ||
              "",

            suggestedCategory:
              category,

            confidence:
              Number(
                aiImageAnalysis
                  ?.confidence ??
                  aiVerification
                    ?.score ??
                  0
              ),

            observations: [
              ...(Array.isArray(
                aiImageAnalysis
                  ?.observations
              )
                ? aiImageAnalysis.observations
                : []),

              ...(aiVerification
                ?.reason
                ? [
                    aiVerification.reason
                  ]
                : [])
            ],

            /*
             * Preserve the detailed
             * consistency information too.
             */
            categoryMatch:
              Boolean(
                aiVerification
                  ?.categoryMatch
              ),

            descriptionMatch:
              Boolean(
                aiVerification
                  ?.descriptionMatch
              ),

            consistencyScore:
              Number(
                aiVerification
                  ?.score || 0
              ),

            result:
              "passed"
          }
        };


        console.log(
          "Submitting past observation:",
          reportData
        );


        const result =
          await createReport(
            reportData
          );


        console.log(
          "Past observation submitted:",
          result
        );


        if (
          !result?.reportId
        ) {
          throw new Error(
            "Complaint was submitted but no report ID was returned."
          );
        }


        setSubmittedReportId(
          result.reportId
        );

        setSuccess(true);

      } catch (err) {
        console.error(
          "Report submission error:",
          err
        );

        setError(
          err.message ||
            "Failed to submit the report."
        );

      } finally {
        setLoading(false);
      }
    };


  /* =======================================================
     SUCCESS SCREEN
  ======================================================= */

  if (success) {
    return (
      <div className="bg-light min-vh-100">

        <div className="container py-5">

          <div className="row justify-content-center">

            <div className="col-12 col-md-8 col-lg-6">

              <div className="card border-0 shadow-sm">

                <div className="card-body text-center p-5">

                  <div
                    className="d-inline-flex align-items-center justify-content-center bg-success-subtle text-success rounded-circle mb-4"
                    style={{
                      width: "72px",
                      height: "72px",
                      fontSize: "32px"
                    }}
                  >
                    ✓
                  </div>

                  <h1 className="h3 fw-bold mb-3">
                    Report Submitted
                  </h1>

                  <p className="text-secondary mb-4">
                    Your past observation has been
                    successfully submitted and is now
                    available through citizen-infrastructure-platform.
                  </p>

                  <div className="d-flex flex-column gap-2">

                    {submittedReportId && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          navigate(
                            `/complaint/${submittedReportId}`,
                            {
                              replace: true
                            }
                          )
                        }
                      >
                        View Complaint
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        navigate(
                          -1
                        )
                      }
                    >
                      ← Back
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="bg-light min-vh-100">

      <div className="container py-4 py-md-5">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-4">

          <button
            type="button"
            className="btn btn-outline-secondary mb-3"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Back
          </button>

          <div className="text-primary small fw-bold text-uppercase mb-2">
            Report Something I Saw
          </div>

          <h1 className="h2 fw-bold mb-2">
            Log a past observation
          </h1>

          <p className="text-secondary mb-0">
            Report an infrastructure problem you
            observed earlier. Add the approximate
            location, observation time, and evidence.
          </p>

        </div>


        {/* =================================================
            ERRORS
        ================================================= */}

        {error && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="row g-4">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="col-12 col-lg-8">

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* ---------------------------------------------
                  LOCATION
              ---------------------------------------------- */}

              <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                  <div className="d-flex align-items-center gap-3 mb-3">

                    <div
                      className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3"
                      style={{
                        width: "42px",
                        height: "42px"
                      }}
                    >
                      📍
                    </div>

                    <div>
                      <h2 className="h5 fw-bold mb-1">
                        Location
                      </h2>

                      <p className="text-secondary small mb-0">
                        Where did you observe the issue?
                      </p>
                    </div>

                  </div>

                  <hr />

                  <label
                    htmlFor="past-location"
                    className="form-label fw-semibold"
                  >
                    Approximate address or landmark
                  </label>

                  <input
                    id="past-location"
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="E.g. Near City Hospital main gate, Kukatpally"
                    value={
                      location
                    }
                    onChange={(event) =>
                      setLocation(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loading
                    }
                  />

                  <div className="form-text">
                    You can enter an address, road,
                    landmark, locality, or other useful
                    location description.
                  </div>

                </div>

              </div>


              {/* ---------------------------------------------
                  OBSERVATION
              ---------------------------------------------- */}

              <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                  <div className="d-flex align-items-center gap-3 mb-3">

                    <div
                      className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning-emphasis rounded-3"
                      style={{
                        width: "42px",
                        height: "42px"
                      }}
                    >
                      ⚠️
                    </div>

                    <div>
                      <h2 className="h5 fw-bold mb-1">
                        Issue information
                      </h2>

                      <p className="text-secondary small mb-0">
                        Tell us what you observed.
                      </p>
                    </div>

                  </div>

                  <hr />


                  {/* Date / Time */}

                  <div className="row g-3 mb-3">

                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="observation-date"
                        className="form-label fw-semibold"
                      >
                        Date observed
                      </label>

                      <input
                        id="observation-date"
                        type="date"
                        className="form-control"
                        value={
                          date
                        }
                        max={
                          new Date()
                            .toISOString()
                            .split(
                              "T"
                            )[0]
                        }
                        onChange={(event) =>
                          setDate(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          loading
                        }
                      />

                    </div>


                    <div className="col-12 col-md-6">

                      <label
                        htmlFor="observation-time"
                        className="form-label fw-semibold"
                      >
                        Approximate time
                      </label>

                      <input
                        id="observation-time"
                        type="time"
                        className="form-control"
                        value={
                          time
                        }
                        onChange={(event) =>
                          setTime(
                            event.target
                              .value
                          )
                        }
                        disabled={
                          loading
                        }
                      />

                    </div>

                  </div>


                  {/* Category */}

                  <div className="mb-3">

                    <label
                      htmlFor="past-category"
                      className="form-label fw-semibold"
                    >
                      Category
                    </label>

                    <select
                      id="past-category"
                      className="form-select"
                      value={
                        category
                      }
                      onChange={(event) =>
                        setCategory(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        loading
                      }
                    >

                      <option value="">
                        Select category
                      </option>

                      {CATEGORIES.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                    </select>

                  </div>


                  {/* Description */}

                  <div>

                    <label
                      htmlFor="past-description"
                      className="form-label fw-semibold"
                    >
                      Description
                    </label>

                    <textarea
                      id="past-description"
                      className="form-control"
                      rows="5"
                      maxLength="1000"
                      placeholder="Describe the issue you observed..."
                      value={
                        description
                      }
                      onChange={(event) =>
                        setDescription(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        loading
                      }
                    />

                    <div className="d-flex justify-content-between mt-1">

                      <small className="text-secondary">
                        Explain what you saw and
                        why it was a problem.
                      </small>

                      <small className="text-secondary">
                        {
                          description.length
                        }
                        /1000
                      </small>

                    </div>

                  </div>

                </div>

              </div>


              {/* ---------------------------------------------
                  EVIDENCE
              ---------------------------------------------- */}

              <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-center gap-3">

                    <div className="d-flex align-items-center gap-3">

                      <div
                        className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3"
                        style={{
                          width: "42px",
                          height: "42px"
                        }}
                      >
                        📷
                      </div>

                      <div>
                        <h2 className="h5 fw-bold mb-1">
                          Visual evidence
                        </h2>

                        <p className="text-secondary small mb-0">
                          Add a photo related to the
                          issue.
                        </p>
                      </div>

                    </div>

                    <span className="badge text-bg-warning">
                      Required
                    </span>

                  </div>

                  <hr />

                  <input
                    id="evidenceImage"
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={
                      handleEvidenceChange
                    }
                    disabled={
                      imageUploading ||
                      aiChecking ||
                      loading
                    }
                  />

                  <small className="text-secondary d-block mt-2">
                    Maximum file size: 5MB.
                  </small>


                  {/* Selected image */}

                  {evidence && (
                    <div className="mt-4">

                      <div className="d-flex justify-content-between align-items-center gap-3 mb-2">

                        <div className="small">

                          <span className="text-secondary">
                            Selected:
                          </span>{" "}

                          <strong>
                            {
                              evidence.name
                            }
                          </strong>

                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={
                            removeEvidence
                          }
                          disabled={
                            imageUploading ||
                            aiChecking ||
                            loading
                          }
                        >
                          Remove
                        </button>

                      </div>


                      {imageUrl && (
                        <img
                          src={
                            imageUrl
                          }
                          alt="Past observation evidence"
                          className="img-fluid rounded-3 border"
                          style={{
                            maxHeight:
                              "400px",
                            width: "100%",
                            objectFit:
                              "cover"
                          }}
                        />
                      )}

                    </div>
                  )}


                  {/* Upload status */}

                  {imageUploading && (
                    <div className="alert alert-info mt-3 mb-0">

                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>

                      Uploading evidence to ImageKit...

                    </div>
                  )}

                </div>

              </div>


              {/* ---------------------------------------------
                  AI IMAGE ANALYSIS
              ---------------------------------------------- */}

              {(aiChecking ||
                aiImageAnalysis) && (

                <div className="card border-primary shadow-sm mb-4">

                  <div className="card-body p-4">

                    <div className="d-flex align-items-center gap-2 mb-3">

                      <span>
                        🤖
                      </span>

                      <h2 className="h5 fw-bold mb-0">
                        AI Evidence Analysis
                      </h2>

                    </div>


                    {aiChecking &&
                      !aiImageAnalysis && (
                        <div className="alert alert-info mb-0">

                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>

                          AI is analyzing the
                          uploaded image...

                        </div>
                      )}


                    {aiImageAnalysis && (
                      <div>

                        <div className="alert alert-success">

                          <strong>
                            ✓ Image analyzed
                          </strong>

                        </div>


                        <div className="row g-3">

                          <div className="col-12 col-md-6">

                            <div className="bg-light rounded-3 p-3">

                              <div className="text-secondary small mb-1">
                                Detected issue
                              </div>

                              <div className="fw-semibold">
                                {
                                  aiImageAnalysis.detectedIssue ||
                                  "Unable to determine"
                                }
                              </div>

                            </div>

                          </div>


                          <div className="col-12 col-md-6">

                            <div className="bg-light rounded-3 p-3">

                              <div className="text-secondary small mb-1">
                                Visual confidence
                              </div>

                              <div className="fw-semibold">
                                {
                                  aiImageAnalysis.confidence ??
                                  0
                                }
                                %
                              </div>

                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}


              {/* ---------------------------------------------
                  FULL AI CHECK
              ---------------------------------------------- */}

              {imageUrl &&
                category &&
                description.trim() && (

                <div className="card border-0 shadow-sm mb-4">

                  <div className="card-body p-4">

                    <div className="d-flex justify-content-between align-items-center gap-3">

                      <div>

                        <div className="text-primary small fw-bold text-uppercase mb-1">
                          Verification
                        </div>

                        <h2 className="h5 fw-bold mb-0">
                          AI Complaint Verification
                        </h2>

                      </div>

                      {aiVerification?.approved && (
                        <span className="badge text-bg-success">
                          Passed
                        </span>
                      )}

                    </div>


                    {aiChecking ? (

                      <div className="alert alert-info mt-3 mb-0">

                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>

                        Checking the photo against
                        your category and description...

                      </div>

                    ) : aiVerification ? (

                      <div className="mt-3">

                        {aiVerification.approved ? (

                          <div className="alert alert-success mb-0">

                            <h3 className="h6 fw-bold">
                              ✓ Information appears
                              consistent
                            </h3>

                            <div className="small">

                              Category match:{" "}

                              {aiVerification.categoryMatch
                                ? "✓"
                                : "✗"}

                            </div>

                            <div className="small">

                              Description match:{" "}

                              {aiVerification.descriptionMatch
                                ? "✓"
                                : "✗"}

                            </div>

                            <div className="small mt-2">

                              Consistency score:{" "}

                              <strong>
                                {
                                  aiVerification.score
                                }
                                %
                              </strong>

                            </div>

                            {aiVerification.reason && (
                              <small className="d-block mt-2">
                                {
                                  aiVerification.reason
                                }
                              </small>
                            )}

                          </div>

                        ) : (

                          <div className="alert alert-warning mb-0">

                            <h3 className="h6 fw-bold">
                              ⚠ Review Required
                            </h3>

                            <div className="small">
                              {
                                aiVerification.reason ||
                                "The evidence does not appear sufficiently consistent with the report."
                              }
                            </div>

                            <div className="small mt-2">

                              Consistency score:{" "}

                              <strong>
                                {
                                  aiVerification.score ||
                                  0
                                }
                                %
                              </strong>

                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-warning mt-3"
                              onClick={
                                retryAICheck
                              }
                              disabled={
                                aiChecking
                              }
                            >
                              Retry AI Check
                            </button>

                          </div>

                        )}

                      </div>

                    ) : (

                      <div className="alert alert-secondary mt-3 mb-0">
                        AI verification will run
                        automatically after the required
                        information is entered.
                      </div>

                    )}


                    {/* AI service error */}

                    {aiError && (
                      <div className="alert alert-warning mt-3 mb-0">

                        <div className="fw-semibold">
                          AI verification unavailable
                        </div>

                        <div className="small mt-1">
                          {aiError}
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning mt-3"
                          onClick={
                            retryAICheck
                          }
                          disabled={
                            aiChecking ||
                            !imageUrl
                          }
                        >
                          Retry AI Analysis
                        </button>

                      </div>
                    )}

                  </div>

                </div>
              )}


              {/* ---------------------------------------------
                  CONFIRMATION
              ---------------------------------------------- */}

              <div className="alert alert-info">

                <small>

                  ℹ By submitting this report, you
                  confirm that the information is
                  accurate. AI checks whether the
                  submitted information appears
                  consistent with the visual evidence.

                </small>

              </div>


              {/* ---------------------------------------------
                  SUBMIT
              ---------------------------------------------- */}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={
                  loading ||
                  imageUploading ||
                  aiChecking ||
                  !aiVerification?.approved
                }
              >

                {loading ? (

                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>

                    Submitting...

                  </>

                ) : imageUploading ? (

                  "Uploading Evidence..."

                ) : aiChecking ? (

                  "AI Checking..."

                ) : !aiVerification?.approved ? (

                  "Complete AI Verification First"

                ) : (

                  "✓ Confirm & Submit Report"

                )}

              </button>

            </form>

          </div>


          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <div className="col-12 col-lg-4">

            {/* How it works */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <h2 className="h5 fw-bold mb-3">
                  How this report works
                </h2>

                <div className="d-flex gap-3 mb-3">

                  <span className="badge rounded-pill text-bg-primary align-self-start">
                    1
                  </span>

                  <div>
                    <div className="fw-semibold">
                      Add the observation
                    </div>

                    <div className="small text-secondary">
                      Tell us when and where you
                      saw the issue.
                    </div>
                  </div>

                </div>


                <div className="d-flex gap-3 mb-3">

                  <span className="badge rounded-pill text-bg-primary align-self-start">
                    2
                  </span>

                  <div>
                    <div className="fw-semibold">
                      Add evidence
                    </div>

                    <div className="small text-secondary">
                      Upload a relevant image.
                    </div>
                  </div>

                </div>


                <div className="d-flex gap-3 mb-3">

                  <span className="badge rounded-pill text-bg-primary align-self-start">
                    3
                  </span>

                  <div>
                    <div className="fw-semibold">
                      AI checks consistency
                    </div>

                    <div className="small text-secondary">
                      AI compares the evidence with
                      your description and category.
                    </div>
                  </div>

                </div>


                <div className="d-flex gap-3">

                  <span className="badge rounded-pill text-bg-primary align-self-start">
                    4
                  </span>

                  <div>
                    <div className="fw-semibold">
                      Complaint becomes public
                    </div>

                    <div className="small text-secondary">
                      Other users can discover the
                      complaint through citizen-infrastructure-platform.
                    </div>
                  </div>

                </div>

              </div>

            </div>


            {/* Important information */}

            <div className="card border-0 shadow-sm mb-4">

              <div className="card-body p-4">

                <h2 className="h5 fw-bold mb-3">
                  Important
                </h2>

                <ul className="small text-secondary mb-0 ps-3">

                  <li className="mb-2">
                    This report is for something you
                    observed in the past.
                  </li>

                  <li className="mb-2">
                    The date and time should represent
                    when you observed the issue.
                  </li>

                  <li className="mb-2">
                    Use the location where the issue
                    actually occurred.
                  </li>

                  <li className="mb-2">
                    AI consistency is not proof that
                    the complaint is true.
                  </li>

                  <li>
                    Submitted complaints can be
                    visible to other citizen-infrastructure-platform users.
                  </li>

                </ul>

              </div>

            </div>


            {/* Explore */}

            <div className="card border-0 shadow-sm">

              <div className="card-body p-4">

                <h2 className="h6 fw-bold">
                  Want to see existing complaints?
                </h2>

                <p className="small text-secondary">
                  Explore complaints from other
                  citizens before submitting your own.
                </p>

                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() =>
                    navigate(
                      "/explore"
                    )
                  }
                >
                  Explore Complaints
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


export default ReportSomething;