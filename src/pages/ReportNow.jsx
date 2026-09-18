import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { uploadImage } from "../services/imageService";
import { analyzeComplaint } from "../services/aiService";

function ReportNow() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [photo, setPhoto] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [imageUploading, setImageUploading] =
    useState(false);

  const [aiChecking, setAiChecking] =
    useState(false);

  const [aiImageAnalysis, setAiImageAnalysis] =
    useState(null);

  const [aiVerification, setAiVerification] =
    useState(null);

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  // ==================================================
  // LOCATION
  // ==================================================

  const getLocation = () => {
    setLocationError("");
    setLocation(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        console.error("Location error:", err);

        if (err.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access."
          );
        } else if (err.code === 2) {
          setLocationError(
            "Your location could not be determined."
          );
        } else if (err.code === 3) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to get your location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // ==================================================
  // CAMERA
  // ==================================================

  const startCamera = async () => {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera is not supported by this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      streamRef.current = stream;

      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera was found.");
      } else {
        setCameraError(
          "Unable to access the camera."
        );
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // ==================================================
  // UPLOAD IMAGE + AI IMAGE ANALYSIS
  // ==================================================

  const processCapturedPhoto = async (
    imageData
  ) => {
    try {
      setError("");
      setImageUploading(true);
      setAiImageAnalysis(null);
      setAiVerification(null);
      setImageUrl("");

      const response = await fetch(imageData);

      const blob = await response.blob();

      const imageFile = new File(
        [blob],
        "citizen-evidence.jpg",
        {
          type: "image/jpeg",
        }
      );

      // ----------------------------------------------
      // Upload to ImageKit
      // ----------------------------------------------

      const uploadedImage = await uploadImage(
        imageFile,
        `/citizen-reports/${auth.currentUser?.uid || "unknown"}/temporary`
      );

      setImageUrl(uploadedImage.url);

      setImageUploading(false);

      // ----------------------------------------------
      // AI IMAGE-ONLY ANALYSIS
      // ----------------------------------------------

      setAiChecking(true);

      const result = await analyzeComplaint({
        imageUrl: uploadedImage.url,
        category: "",
        description: "",
        mode: "image-only",
      });

      setAiImageAnalysis(
        result.imageAssessment || null
      );

      setAiChecking(false);

      // If fields already exist, perform full check
      if (
        category.trim() &&
        description.trim()
      ) {
        await runFullAICheck(
          uploadedImage.url,
          category,
          description
        );
      }
    } catch (err) {
      console.error(
        "Photo processing error:",
        err
      );

      setImageUploading(false);
      setAiChecking(false);

      setError(
        err.message ||
          "Failed to process the evidence image."
      );
    }
  };

  // ==================================================
  // CAPTURE PHOTO
  // ==================================================

  const capturePhoto = async () => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.85
    );

    setPhoto(imageData);

    stopCamera();

    await processCapturedPhoto(imageData);
  };

  // ==================================================
  // RETAKE
  // ==================================================

  const retakePhoto = async () => {
    setPhoto(null);
    setImageUrl("");
    setAiImageAnalysis(null);
    setAiVerification(null);
    setError("");

    await startCamera();
  };

  // ==================================================
  // FULL AI VERIFICATION
  // ==================================================

  const runFullAICheck = async (
    currentImageUrl = imageUrl,
    currentCategory = category,
    currentDescription = description
  ) => {
    if (
      !currentImageUrl ||
      !currentCategory.trim() ||
      !currentDescription.trim()
    ) {
      return;
    }

    try {
      setError("");
      setAiChecking(true);
      setAiVerification(null);

      const result = await analyzeComplaint({
        imageUrl: currentImageUrl,
        category: currentCategory,
        description: currentDescription,
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
  // INITIAL SETUP
  // ==================================================

  useEffect(() => {
    getLocation();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // ==================================================
  // AUTOMATIC FINAL AI CHECK
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
      runFullAICheck(
        imageUrl,
        category,
        description
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [category, description, imageUrl]);

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

    if (!location) {
      setError(
        "Current location is required."
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

    if (!photo || !imageUrl) {
      setError(
        "Please capture a photo of the issue."
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
        userId: auth.currentUser.uid,

        reportType: "report-now",

        category,

        description: description.trim(),

        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },

        evidence: {
          hasImage: true,
          imageUrl,
          fileName: "citizen-evidence.jpg",
          fileType: "image/jpeg",
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

        status: "reported",

        createdAt: serverTimestamp(),
      };

      const reportRef = await addDoc(
        collection(db, "reports"),
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
                  style={{ fontSize: "60px" }}
                >
                  ✅
                </div>

                <h2 className="fw-bold">
                  Report Submitted
                </h2>

                <p className="text-muted">
                  Your complaint passed the AI
                  evidence consistency check and
                  was successfully submitted.
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
              navigate("/citizen")
            }
          >
            ← Back to Dashboard
          </button>

          <div className="card shadow-sm border-0">
            <div className="card-body p-4">

              <h2 className="fw-bold mb-1">
                Report a Live Issue
              </h2>

              <p className="text-muted mb-4">
                GPS and camera evidence will be
                securely captured for this report.
              </p>

              {/* LOCATION */}

              <div className="card mb-4">
                <div className="card-body">

                  <h6 className="fw-bold">
                    📍 Location Details
                  </h6>

                  {location ? (
                    <div className="alert alert-light border mt-3 mb-0">
                      ✓ Location captured
                      <br />
                      <small>
                        {location.latitude},{" "}
                        {location.longitude}
                        {" "}
                        (Accuracy:{" "}
                        {Math.round(
                          location.accuracy
                        )}
                        m)
                      </small>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <span className="text-muted">
                        Getting your location...
                      </span>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={getLocation}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {locationError && (
                    <div className="alert alert-danger mt-3 mb-0">
                      {locationError}
                    </div>
                  )}

                </div>
              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>

                {/* ISSUE */}

                <div className="card mb-4">
                  <div className="card-body">

                    <h6 className="fw-bold mb-3">
                      ⚠️ Issue Information
                    </h6>

                    <div className="mb-3">

                      <label className="form-label">
                        Category
                      </label>

                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) =>
                          setCategory(
                            e.target.value
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

                    <div className="mb-2">

                      <label className="form-label">
                        Description
                      </label>

                      <textarea
                        className="form-control"
                        rows="4"
                        maxLength="1000"
                        placeholder="Describe the issue in detail..."
                        value={description}
                        onChange={(e) =>
                          setDescription(
                            e.target.value
                          )
                        }
                      />

                      <small className="text-muted">
                        {description.length}/1000
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

                    {!photo && !cameraActive && (
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100 mt-3"
                        onClick={startCamera}
                      >
                        📷 Open Camera
                      </button>
                    )}

                    {cameraActive && (
                      <div className="mt-3">

                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-100 rounded border"
                          style={{
                            maxHeight: "400px",
                            objectFit: "cover",
                          }}
                        />

                        <button
                          type="button"
                          className="btn btn-primary w-100 mt-3"
                          onClick={capturePhoto}
                        >
                          📸 Capture Photo
                        </button>

                      </div>
                    )}

                    {photo && (
                      <div className="mt-3">

                        <img
                          src={photo}
                          alt="Captured evidence"
                          className="img-fluid rounded border w-100"
                          style={{
                            maxHeight: "400px",
                            objectFit: "cover",
                          }}
                        />

                        <button
                          type="button"
                          className="btn btn-outline-secondary w-100 mt-3"
                          onClick={retakePhoto}
                        >
                          🔄 Retake Photo
                        </button>

                      </div>
                    )}

                    {cameraError && (
                      <div className="alert alert-danger mt-3 mb-0">
                        {cameraError}
                      </div>
                    )}

                  </div>
                </div>

                {/* AI IMAGE CHECK */}

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
                          Uploading evidence securely...
                        </div>
                      )}

                      {!imageUploading &&
                        aiChecking &&
                        !aiVerification && (
                          <div className="alert alert-info mt-3 mb-0">
                            🤖 AI is analyzing the
                            evidence...
                          </div>
                        )}

                      {aiImageAnalysis && (
                        <div className="mt-3">

                          <div className="alert alert-success mb-2">
                            ✓ Image analyzed
                          </div>

                          <div>
                            <strong>
                              Detected issue:
                            </strong>{" "}
                            {aiImageAnalysis.detectedIssue ||
                              "Unable to determine"}
                          </div>

                          <div>
                            <strong>
                              Visual confidence:
                            </strong>{" "}
                            {aiImageAnalysis.confidence ??
                              0}
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
                            🤖 Checking photo against
                            your category and
                            description...
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
                            AI verification will run
                            automatically.
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
                    is accurate. AI checks whether the
                    submitted information appears
                    consistent with the visual evidence.
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

export default ReportNow;