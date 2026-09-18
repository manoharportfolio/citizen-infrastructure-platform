import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

import { uploadImage } from "../services/imageService";

import { analyzeComplaint } from "../services/aiService";

function ReportSomething() {
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [location, setLocation] = useState("");

  const [category, setCategory] = useState("");

  const [description, setDescription] =
    useState("");

  const [evidence, setEvidence] =
    useState(null);

  const [imageUrl, setImageUrl] =
    useState("");

  const [imageUploading, setImageUploading] =
    useState(false);

  const [aiChecking, setAiChecking] =
    useState(false);

  const [aiImageAnalysis, setAiImageAnalysis] =
    useState(null);

  const [aiVerification, setAiVerification] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==================================================
  // IMAGE SELECT
  // ==================================================

  const handleEvidenceChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5MB."
      );
      return;
    }

    setEvidence(file);

    setImageUrl("");

    setAiImageAnalysis(null);

    setAiVerification(null);

    try {
      setImageUploading(true);

      // ----------------------------------------------
      // UPLOAD TO IMAGEKIT
      // ----------------------------------------------

      const uploadedImage =
        await uploadImage(
          file,
          `/citizen-reports/${auth.currentUser?.uid || "unknown"}/temporary`
        );

      setImageUrl(
        uploadedImage.url
      );

      setImageUploading(false);

      // ----------------------------------------------
      // AI IMAGE ANALYSIS
      // ----------------------------------------------

      setAiChecking(true);

      const result =
        await analyzeComplaint({
          imageUrl:
            uploadedImage.url,

          category: "",

          description: "",

          mode: "image-only",
        });

      setAiImageAnalysis(
        result.imageAssessment || null
      );

      setAiChecking(false);

    } catch (err) {
      console.error(
        "Evidence processing error:",
        err
      );

      setImageUploading(false);
      setAiChecking(false);

      setError(
        err.message ||
          "Failed to process the evidence."
      );
    }
  };

  // ==================================================
  // REMOVE IMAGE
  // ==================================================

  const removeEvidence = () => {
    setEvidence(null);

    setImageUrl("");

    setAiImageAnalysis(null);

    setAiVerification(null);

    const input =
      document.getElementById(
        "evidenceImage"
      );

    if (input) {
      input.value = "";
    }
  };

  // ==================================================
  // FULL AI CHECK
  // ==================================================

  const runFullAICheck = async () => {
    if (
      !imageUrl ||
      !category.trim() ||
      !description.trim()
    ) {
      return;
    }

    try {
      setError("");

      setAiChecking(true);

      setAiVerification(null);

      const result =
        await analyzeComplaint({
          imageUrl,

          category,

          description,

          mode: "full-check",
        });

      setAiVerification(
        result.consistency || null
      );

      setAiChecking(false);

    } catch (err) {
      console.error(
        "AI verification error:",
        err
      );

      setAiChecking(false);

      setAiVerification({
        approved: false,
        score: 0,
        categoryMatch: false,
        descriptionMatch: false,
        reason:
          "AI verification could not be completed.",
      });
    }
  };

  // ==================================================
  // AUTOMATIC FINAL CHECK
  // ==================================================

  useEffect(() => {
    if (
      !imageUrl ||
      !category.trim() ||
      !description.trim()
    ) {
      setAiVerification(null);
      return;
    }

    const timer = setTimeout(() => {
      runFullAICheck();
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    imageUrl,
    category,
    description,
  ]);

  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!auth.currentUser) {
      setError(
        "You must be logged in to submit a report."
      );
      return;
    }

    if (!date) {
      setError(
        "Please select when you observed the issue."
      );
      return;
    }

    if (!time) {
      setError(
        "Please select the approximate time."
      );
      return;
    }

    if (!location.trim()) {
      setError(
        "Please enter the approximate location."
      );
      return;
    }

    if (!category) {
      setError(
        "Please select an issue category."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Please describe the issue."
      );
      return;
    }

    if (!evidence || !imageUrl) {
      setError(
        "Evidence photo is required."
      );
      return;
    }

    if (imageUploading || aiChecking) {
      setError(
        "Please wait for the AI evidence check to finish."
      );
      return;
    }

    if (
      !aiVerification ||
      !aiVerification.approved
    ) {
      setError(
        "The AI consistency check has not passed. Please review your photo, category, and description."
      );
      return;
    }

    try {
      setLoading(true);

      const reportData = {
        userId:
          auth.currentUser.uid,

        reportType:
          "report-something",

        category,

        description:
          description.trim(),

        observation: {
          date,

          time,
        },

        location: {
          approximateLocation:
            location.trim(),
        },

        evidence: {
          hasImage: true,

          imageUrl,

          fileName:
            evidence.name,

          fileType:
            evidence.type,
        },

        aiAnalysis: {
          checked: true,

          imageDetectedIssue:
            aiImageAnalysis?.detectedIssue ||
            null,

          visualConfidence:
            aiImageAnalysis?.confidence ||
            null,

          categoryMatch:
            aiVerification.categoryMatch ||
            false,

          descriptionMatch:
            aiVerification.descriptionMatch ||
            false,

          consistencyScore:
            aiVerification.score || 0,

          result: "passed",
        },

        status:
          "reported",

        createdAt:
          serverTimestamp(),
      };

      const reportRef =
        await addDoc(
          collection(
            db,
            "reports"
          ),
          reportData
        );

      console.log(
        "Report submitted:",
        reportRef.id
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

  // ==================================================
  // SUCCESS
  // ==================================================

  if (success) {
    return (
      <div className="container py-5">

        <div className="row justify-content-center">

          <div className="col-md-7">

            <div className="card shadow-sm border-0">

              <div className="card-body text-center p-5">

                <div
                  className="mb-3"
                  style={{
                    fontSize: "60px",
                  }}
                >
                  ✅
                </div>

                <h2 className="fw-bold">
                  Report Submitted
                </h2>

                <p className="text-muted">
                  Your report passed the AI
                  evidence consistency check
                  and was successfully
                  submitted.
                </p>

                <button
                  className="btn btn-primary mt-3"
                  onClick={() =>
                    navigate(
                      "/citizen"
                    )
                  }
                >
                  Back to Dashboard
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="container py-4">

      <div className="row justify-content-center">

        <div className="col-lg-8">

          <button
            className="btn btn-link p-0 text-decoration-none mb-4"
            onClick={() =>
              navigate(
                "/citizen"
              )
            }
          >
            ← Back to Dashboard
          </button>

          <div className="card shadow-sm border-0">

            <div className="card-body p-4">

              <h2 className="fw-bold mb-1">
                Log Past Sighting
              </h2>

              <p className="text-muted mb-4">
                Report an issue you saw
                previously. Evidence helps AI
                validate the report.
              </p>

              <form
                onSubmit={
                  handleSubmit
                }
              >

                {/* LOCATION */}

                <div className="card mb-4">

                  <div className="card-body">

                    <h6 className="fw-bold">
                      📍 Location Details
                    </h6>

                    <hr />

                    <label className="form-label">
                      Approximate Address or Landmark
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="E.g., Near City Hospital main gate..."
                      value={
                        location
                      }
                      onChange={(e) =>
                        setLocation(
                          e.target
                            .value
                        )
                      }
                    />

                  </div>

                </div>

                {/* ISSUE */}

                <div className="card mb-4">

                  <div className="card-body">

                    <h6 className="fw-bold">
                      ⚠️ Issue Information
                    </h6>

                    <hr />

                    <div className="row">

                      <div className="col-md-6 mb-3">

                        <label className="form-label">
                          Date Observed
                        </label>

                        <input
                          type="date"
                          className="form-control"
                          value={date}
                          max={
                            new Date()
                              .toISOString()
                              .split(
                                "T"
                              )[0]
                          }
                          onChange={(e) =>
                            setDate(
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                      <div className="col-md-6 mb-3">

                        <label className="form-label">
                          Approximate Time
                        </label>

                        <input
                          type="time"
                          className="form-control"
                          value={time}
                          onChange={(e) =>
                            setTime(
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                    <div className="mb-3">

                      <label className="form-label">
                        Category
                      </label>

                      <select
                        className="form-select"
                        value={
                          category
                        }
                        onChange={(e) =>
                          setCategory(
                            e.target
                              .value
                          )
                        }
                      >

                        <option value="">
                          Select category
                        </option>

                        <option value="Road Damage">
                          Roads & Potholes
                        </option>

                        <option value="Garbage">
                          Garbage
                        </option>

                        <option value="Footpath">
                          Footpath
                        </option>

                        <option value="Streetlight">
                          Streetlight
                        </option>

                        <option value="Water">
                          Water
                        </option>

                        <option value="Drainage">
                          Drainage
                        </option>

                        <option value="Public Transport">
                          Public Transport
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>

                    <div>

                      <label className="form-label">
                        Description
                      </label>

                      <textarea
                        className="form-control"
                        rows="4"
                        maxLength="1000"
                        placeholder="Describe the issue in detail..."
                        value={
                          description
                        }
                        onChange={(e) =>
                          setDescription(
                            e.target
                              .value
                          )
                        }
                      />

                      <small className="text-muted">
                        {
                          description.length
                        }
                        /1000
                      </small>

                    </div>

                  </div>

                </div>

                {/* EVIDENCE */}

                <div className="card mb-4">

                  <div className="card-body">

                    <div className="d-flex justify-content-between">

                      <h6 className="fw-bold">
                        📷 Visual Evidence
                      </h6>

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
                    />

                    <small className="text-muted d-block mt-2">
                      Upload a photo related
                      to the issue. Maximum
                      size: 5MB.
                    </small>

                    {evidence && (
                      <div className="mt-3">

                        <div className="d-flex justify-content-between align-items-center">

                          <div>
                            <strong>
                              Selected:
                            </strong>{" "}
                            {
                              evidence.name
                            }
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={
                              removeEvidence
                            }
                          >
                            Remove
                          </button>

                        </div>

                      </div>
                    )}

                  </div>

                </div>

                {/* AI IMAGE ANALYSIS */}

                {(imageUploading ||
                  aiChecking ||
                  aiImageAnalysis) && (

                  <div className="card border-primary mb-4">

                    <div className="card-body">

                      <h6 className="fw-bold">
                        🤖 AI Evidence Analysis
                      </h6>

                      {imageUploading && (
                        <div className="alert alert-info mt-3 mb-0">
                          Uploading evidence
                          securely...
                        </div>
                      )}

                      {!imageUploading &&
                        aiChecking &&
                        !aiVerification && (
                          <div className="alert alert-info mt-3 mb-0">
                            🤖 AI is analyzing
                            the uploaded image...
                          </div>
                        )}

                      {aiImageAnalysis && (
                        <div className="mt-3">

                          <div className="alert alert-success">
                            ✓ Image analyzed
                          </div>

                          <div>
                            <strong>
                              Detected issue:
                            </strong>{" "}
                            {
                              aiImageAnalysis.detectedIssue ||
                              "Unable to determine"
                            }
                          </div>

                          <div>
                            <strong>
                              Visual confidence:
                            </strong>{" "}
                            {
                              aiImageAnalysis.confidence ??
                              0
                            }
                            %
                          </div>

                        </div>
                      )}

                    </div>

                  </div>

                )}

                {/* FINAL AI CHECK */}

                {imageUrl &&
                  category &&
                  description.trim() && (

                    <div className="card mb-4">

                      <div className="card-body">

                        <h6 className="fw-bold">
                          🤖 AI Complaint Verification
                        </h6>

                        {aiChecking ? (

                          <div className="alert alert-info mt-3 mb-0">
                            🤖 Checking the photo
                            against your category
                            and description...
                          </div>

                        ) : aiVerification ? (

                          <div className="mt-3">

                            {aiVerification.approved ? (

                              <div className="alert alert-success mb-0">

                                <h6 className="fw-bold">
                                  ✓ Information appears
                                  consistent
                                </h6>

                                <div>
                                  Category match:{" "}
                                  {aiVerification.categoryMatch
                                    ? "✓"
                                    : "✗"}
                                </div>

                                <div>
                                  Description match:{" "}
                                  {aiVerification.descriptionMatch
                                    ? "✓"
                                    : "✗"}
                                </div>

                                <div className="mt-2">
                                  Consistency score:{" "}
                                  <strong>
                                    {
                                      aiVerification.score
                                    }
                                    %
                                  </strong>
                                </div>

                                <small className="d-block mt-2">
                                  {
                                    aiVerification.reason
                                  }
                                </small>

                              </div>

                            ) : (

                              <div className="alert alert-warning mb-0">

                                <h6 className="fw-bold">
                                  ⚠ Review Required
                                </h6>

                                <div>
                                  {
                                    aiVerification.reason
                                  }
                                </div>

                                <div className="mt-2">
                                  Consistency score:{" "}
                                  <strong>
                                    {
                                      aiVerification.score
                                    }
                                    %
                                  </strong>
                                </div>

                              </div>

                            )}

                          </div>

                        ) : (

                          <div className="alert alert-secondary mt-3 mb-0">
                            AI verification will
                            run automatically after
                            the required information
                            is entered.
                          </div>

                        )}

                      </div>

                    </div>
                  )}

                {/* CONFIRMATION */}

                <div className="alert alert-info">

                  <small>
                    ℹ By submitting this report,
                    you confirm that the information
                    is accurate. AI checks whether
                    the submitted information appears
                    consistent with the visual
                    evidence.
                  </small>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={
                    loading ||
                    imageUploading ||
                    aiChecking ||
                    !aiVerification?.approved
                  }
                >
                  {loading
                    ? "Submitting..."
                    : imageUploading
                    ? "Uploading Evidence..."
                    : aiChecking
                    ? "AI Checking..."
                    : !aiVerification?.approved
                    ? "Complete AI Verification First"
                    : "✓ Confirm & Submit Report"}
                </button>

              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ReportSomething;