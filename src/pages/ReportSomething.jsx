import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { uploadImage } from "../services/imageService";

function ReportSomething() {
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [location, setLocation] = useState("");

  const [category, setCategory] = useState("");

  const [description, setDescription] = useState("");

  const [evidence, setEvidence] = useState(null);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // FILE SELECTION
  // --------------------------------------------------

  const handleEvidenceChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be less than 5MB."
      );
      return;
    }

    setError("");
    setEvidence(file);
  };

  // --------------------------------------------------
  // REMOVE EVIDENCE
  // --------------------------------------------------

  const removeEvidence = () => {
    setEvidence(null);

    // Reset file input
    const fileInput =
      document.getElementById(
        "evidenceImage"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // --------------------------------------------------
  // SUBMIT REPORT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ----------------------------------------------
    // CHECK LOGIN
    // ----------------------------------------------

    if (!auth.currentUser) {
      setError(
        "You must be logged in to submit a report."
      );
      return;
    }

    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

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

    try {
      setLoading(true);

      // ----------------------------------------------
      // STEP 1: CREATE FIRESTORE REPORT
      // ----------------------------------------------

      const reportData = {
        userId: auth.currentUser.uid,

        reportType: "report-something",

        category: category,

        description: description.trim(),

        observation: {
          date: date,
          time: time,
        },

        location: {
          approximateLocation:
            location.trim(),
        },

        evidence: {
          hasImage: !!evidence,
          imageUrl: null,
          fileName: evidence
            ? evidence.name
            : null,
          fileType: evidence
            ? evidence.type
            : null,
        },

        aiAnalysis: {
          checked: false,
          matchScore: null,
          issueDetected: null,
          result: "pending",
        },

        status: "reported",

        createdAt: serverTimestamp(),
      };

      const reportRef = await addDoc(
        collection(db, "reports"),
        reportData
      );

      console.log(
        "Report created:",
        reportRef.id
      );

      // ----------------------------------------------
      // STEP 2: UPLOAD OPTIONAL IMAGE TO IMAGEKIT
      // ----------------------------------------------

      if (evidence) {
        const uploadedImage =
          await uploadImage(
            evidence,
            `/citizen-reports/${auth.currentUser.uid}/${reportRef.id}`
          );

        console.log(
          "ImageKit upload successful:",
          uploadedImage
        );

        // --------------------------------------------
        // STEP 3: SAVE IMAGE URL IN FIRESTORE
        // --------------------------------------------

        await updateDoc(
          doc(db, "reports", reportRef.id),
          {
            "evidence.imageUrl":
              uploadedImage.url,

            "evidence.fileId":
              uploadedImage.fileId,
          }
        );

        console.log(
          "Report updated with ImageKit URL."
        );
      }

      // ----------------------------------------------
      // SUCCESS
      // ----------------------------------------------

      setSuccess(true);

    } catch (err) {
      console.error(
        "Report submission error:",
        err
      );

      setError(
        err.message ||
          "Failed to submit the report. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------

  if (success) {
    return (
      <div className="container py-5">

        <div className="row justify-content-center">

          <div className="col-md-7">

            <div className="card shadow-sm border-0">

              <div className="card-body text-center p-5">

                <div
                  className="mb-3"
                  style={{ fontSize: "60px" }}
                >
                  ✅
                </div>

                <h2 className="fw-bold">
                  Report Submitted
                </h2>

                <p className="text-muted">
                  Your report has been successfully
                  submitted.
                </p>

                <p className="small text-muted">
                  The information will be used for
                  further verification and prioritization.
                </p>

                <button
                  className="btn btn-primary mt-3"
                  onClick={() =>
                    navigate("/citizen")
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

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div className="container py-4">

      <div className="row justify-content-center">

        <div className="col-lg-8">

          {/* BACK BUTTON */}

          <div className="mb-4">

            <button
              className="btn btn-link p-0 text-decoration-none"
              onClick={() =>
                navigate("/citizen")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

          {/* CARD */}

          <div className="card shadow-sm border-0">

            <div className="card-body p-4">

              <h2 className="fw-bold mb-2">
                Report Something I Saw
              </h2>

              <p className="text-muted mb-4">
                Report an infrastructure issue you
                noticed earlier.
              </p>

              {/* OBSERVATION DATE */}

              <div className="row">

                <div className="col-md-6 mb-3">

                  <label className="form-label fw-semibold">
                    Date Observed
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    max={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                  />

                </div>

                {/* OBSERVATION TIME */}

                <div className="col-md-6 mb-3">

                  <label className="form-label fw-semibold">
                    Approximate Time
                  </label>

                  <input
                    type="time"
                    className="form-control"
                    value={time}
                    onChange={(e) =>
                      setTime(e.target.value)
                    }
                  />

                </div>

              </div>

              {/* LOCATION */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
                  Approximate Location
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Example: Near Kukatpally Metro Station"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                />

                <div className="form-text">
                  Enter a landmark, street, area,
                  junction, or other useful location
                  information.
                </div>

              </div>

              {/* CATEGORY */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
                  Issue Category
                </label>

                <select
                  className="form-select"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >

                  <option value="">
                    Select an issue
                  </option>

                  <option value="Road Damage">
                    Road Damage
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

              {/* DESCRIPTION */}

              <div className="mb-3">

                <label className="form-label fw-semibold">
                  Describe the Issue
                </label>

                <textarea
                  className="form-control"
                  rows="5"
                  maxLength="1000"
                  placeholder="Describe what you observed..."
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                />

                <div className="text-end small text-muted mt-1">
                  {description.length}/1000
                </div>

              </div>

              {/* OPTIONAL EVIDENCE */}

              <div className="mb-4">

                <label className="form-label fw-semibold">
                  Evidence Image
                  <span className="text-muted fw-normal">
                    {" "}
                    (Optional)
                  </span>
                </label>

                <input
                  id="evidenceImage"
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={
                    handleEvidenceChange
                  }
                />

                <div className="form-text">
                  You can optionally upload an image
                  related to what you observed.
                  Maximum size: 5MB.
                </div>

                {/* SELECTED IMAGE */}

                {evidence && (
                  <div className="card mt-3">

                    <div className="card-body">

                      <div className="d-flex justify-content-between align-items-center">

                        <div>
                          <strong>
                            Selected Image
                          </strong>

                          <div className="small text-muted">
                            {evidence.name}
                          </div>

                          <div className="small text-muted">
                            {(
                              evidence.size /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB
                          </div>
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

                  </div>
                )}

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
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? "Submitting Report..."
                  : "Submit Report"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ReportSomething;