import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";
import { uploadImage } from "../services/imageService";
import { analyzeComplaint } from "../services/aiService";

function ReportNow() {
  const navigate = useNavigate();

  const videoRef = useRef(null);

  // Current active camera stream
  const streamRef = useRef(null);

  // Used to invalidate old camera requests
  const cameraRequestRef = useRef(0);

  // Used to know whether component is still mounted
  const mountedRef = useRef(false);

  // ==================================================
  // LOCATION
  // ==================================================

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] =
    useState(false);

  // ==================================================
  // CAMERA
  // ==================================================

  const [cameraActive, setCameraActive] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  // ==================================================
  // PHOTO
  // ==================================================

  const [photo, setPhoto] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // ==================================================
  // COMPLAINT
  // ==================================================

  const [category, setCategory] = useState("");
  const [description, setDescription] =
    useState("");

  // ==================================================
  // AI
  // ==================================================

  const [imageUploading, setImageUploading] =
    useState(false);

  const [aiChecking, setAiChecking] =
    useState(false);

  const [aiImageAnalysis, setAiImageAnalysis] =
    useState(null);

  const [aiVerification, setAiVerification] =
    useState(null);

  // ==================================================
  // SUBMISSION
  // ==================================================

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // LOCATION
  // ==================================================

  const getLocation = () => {
    setLocationError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationLoading(false);

      setLocationError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        setLocation({
          latitude,
          longitude,
          accuracy,
          area: "",
          city: "",
          district: "",
          state: "",
        });

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          if (!response.ok) {
            throw new Error(
              "Unable to identify location."
            );
          }

          const data =
            await response.json();

          const address =
            data.address || {};

          const area =
            address.suburb ||
            address.neighbourhood ||
            address.quarter ||
            address.village ||
            "";

          const city =
            address.city ||
            address.town ||
            address.municipality ||
            address.village ||
            "";

          const district =
            address.state_district ||
            address.district ||
            address.county ||
            "";

          const state =
            address.state || "";

          setLocation({
            latitude,
            longitude,
            accuracy,
            area,
            city,
            district,
            state,
          });

          setLocationError("");
          setLocationLoading(false);
        } catch (err) {
          console.error(
            "Reverse geocoding error:",
            err
          );

          setLocation({
            latitude,
            longitude,
            accuracy,
            area: "",
            city: "",
            district: "",
            state: "",
          });

          setLocationError(
            "GPS location was captured, but area details could not be identified."
          );

          setLocationLoading(false);
        }
      },

      (err) => {
        console.error(
          "Location error:",
          err
        );

        setLocationLoading(false);

        if (err.code === 1) {
          setLocationError(
            "Location permission was denied. Please allow location access."
          );
        } else if (err.code === 2) {
          setLocationError(
            "Your current location could not be determined."
          );
        } else if (err.code === 3) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to get your current location."
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  // ==================================================
  // STOP CAMERA
  // ==================================================

  const stopCamera = () => {
    console.log("STOP CAMERA");

    // Invalidate every previous camera request.
    cameraRequestRef.current += 1;

    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(
          "Stopping:",
          track.kind,
          track.readyState
        );

        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (mountedRef.current) {
      setCameraActive(false);
    }
  };

  // ==================================================
  // START CAMERA
  // ==================================================

  const startCamera = async () => {
    try {
      setCameraError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          "Camera is not supported by this browser."
        );

        return;
      }

      // Stop any previous stream first.
      stopCamera();

      // Create a new unique request.
      const requestId =
        ++cameraRequestRef.current;

      console.log(
        "START CAMERA REQUEST:",
        requestId
      );

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: {
                ideal: "environment",
              },
            },
            audio: false,
          }
        );

      console.log(
        "CAMERA STREAM RECEIVED:",
        requestId
      );

      // ==================================================
      // VERY IMPORTANT
      //
      // If the user left the page while getUserMedia()
      // was waiting, immediately kill this stream.
      // ==================================================

      if (
        !mountedRef.current ||
        requestId !== cameraRequestRef.current ||
        document.hidden
      ) {
        console.log(
          "Old/invalid camera stream. Stopping it."
        );

        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        return;
      }

      streamRef.current = stream;

      setCameraActive(true);

    } catch (err) {
      console.error(
        "Camera error:",
        err
      );

      if (
        err.name === "NotAllowedError" ||
        err.name ===
          "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission was denied. Please allow camera access."
        );
      } else if (
        err.name === "NotFoundError"
      ) {
        setCameraError(
          "No camera was found on this device."
        );
      } else if (
        err.name === "NotReadableError"
      ) {
        setCameraError(
          "The camera is already being used by another application."
        );
      } else {
        setCameraError(
          "Unable to access the camera."
        );
      }
    }
  };

  // ==================================================
  // ATTACH STREAM TO VIDEO
  // ==================================================

  useEffect(() => {
    if (
      cameraActive &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;

      videoRef.current
        .play()
        .catch((err) => {
          console.log(
            "Video play:",
            err
          );
        });
    }
  }, [cameraActive]);

  // ==================================================
  // CAMERA LIFECYCLE
  // ==================================================

  useEffect(() => {
    mountedRef.current = true;

    // Start initial camera
    startCamera();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(
          "TAB HIDDEN → STOP CAMERA"
        );

        stopCamera();
      }
    };

    const handlePageHide = () => {
      console.log(
        "PAGE HIDDEN → STOP CAMERA"
      );

      stopCamera();
    };

    const handleBlur = () => {
      console.log(
        "WINDOW BLURRED → STOP CAMERA"
      );

      stopCamera();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    window.addEventListener(
      "blur",
      handleBlur
    );

    return () => {
      console.log(
        "REPORT NOW UNMOUNT → STOP CAMERA"
      );

      mountedRef.current = false;

      // Invalidate pending getUserMedia()
      cameraRequestRef.current += 1;

      // Stop current stream
      const stream =
        streamRef.current;

      if (stream) {
        stream.getTracks().forEach(
          (track) => {
            track.stop();
          }
        );

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      window.removeEventListener(
        "blur",
        handleBlur
      );
    };
  }, []);

  // ==================================================
  // PROCESS PHOTO
  // ==================================================

  const processCapturedPhoto =
    async (imageData) => {
      try {
        setError("");

        setImageUploading(true);

        setAiImageAnalysis(null);
        setAiVerification(null);
        setImageUrl("");

        const response =
          await fetch(imageData);

        const blob =
          await response.blob();

        const imageFile = new File(
          [blob],
          "citizen-evidence.jpg",
          {
            type: "image/jpeg",
          }
        );

        const uploadedImage =
          await uploadImage(
            imageFile,
            `/citizen-reports/${
              auth.currentUser?.uid ||
              "unknown"
            }/temporary`
          );

        setImageUrl(
          uploadedImage.url
        );

        setImageUploading(false);

        // Image-only AI analysis
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
          result.imageAssessment ||
            null
        );

        setAiChecking(false);

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
    const video =
      videoRef.current;

    if (!video) {
      setCameraError(
        "Camera is not ready."
      );

      return;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      setCameraError(
        "Camera is still starting. Please wait."
      );

      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setCameraError(
        "Camera image is not ready."
      );

      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      setCameraError(
        "Unable to capture camera image."
      );

      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData =
      canvas.toDataURL(
        "image/jpeg",
        0.85
      );

    setPhoto(imageData);

    // STOP CAMERA IMMEDIATELY
    stopCamera();

    await processCapturedPhoto(
      imageData
    );
  };

  // ==================================================
  // RETAKE
  // ==================================================

  const retakePhoto =
    async () => {
      stopCamera();

      setPhoto(null);
      setImageUrl("");

      setAiImageAnalysis(null);
      setAiVerification(null);

      setError("");
      setCameraError("");

      await startCamera();
    };

  // ==================================================
  // FULL AI CHECK
  // ==================================================

  const runFullAICheck =
    async () => {
      if (!imageUrl) {
        setError(
          "Please capture and analyze a photo first."
        );

        return;
      }

      if (!category.trim()) {
        setError(
          "Please select an issue category first."
        );

        return;
      }

      if (!description.trim()) {
        setError(
          "Please describe the issue first."
        );

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
          result.consistency ||
            null
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

        setError(
          err.message ||
            "AI verification failed."
        );
      }
    };

  // ==================================================
  // LOCATION ON LOAD
  // ==================================================

  useEffect(() => {
    getLocation();
  }, []);

  // ==================================================
  // INVALIDATE AI VERIFICATION
  // ==================================================

  useEffect(() => {
    if (aiVerification) {
      setAiVerification(null);
    }
  }, [
    category,
    description,
  ]);

  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit =
    async (e) => {
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
          "Please capture and analyze a photo."
        );
        return;
      }

      if (
        imageUploading ||
        aiChecking
      ) {
        setError(
          "Please wait for the AI check to finish."
        );
        return;
      }

      if (
        !aiVerification ||
        !aiVerification.approved
      ) {
        setError(
          "Please complete the AI complaint verification before submitting."
        );
        return;
      }

      if (
        !aiVerification.categoryMatch ||
        !aiVerification.descriptionMatch
      ) {
        setError(
          "The photo does not sufficiently match the submitted details."
        );
        return;
      }

      try {
        setLoading(true);

        const reportData = {
          userId:
            auth.currentUser.uid,

          reportType:
            "report-now",

          category,

          description:
            description.trim(),

          location: {
            latitude:
              location.latitude,

            longitude:
              location.longitude,

            accuracy:
              location.accuracy,

            area:
              location.area || "",

            city:
              location.city || "",

            district:
              location.district || "",

            state:
              location.state || "",
          },

          evidence: {
            hasImage: true,

            imageUrl,

            fileName:
              "citizen-evidence.jpg",

            fileType:
              "image/jpeg",
          },

          aiAnalysis: {
            checked: true,

            imageDetectedIssue:
              aiImageAnalysis
                ?.detectedIssue ||
              null,

            visualConfidence:
              aiImageAnalysis
                ?.confidence ??
              null,

            categoryMatch:
              aiVerification
                .categoryMatch ??
              false,

            descriptionMatch:
              aiVerification
                .descriptionMatch ??
              false,

            consistencyScore:
              aiVerification
                .score ??
              0,

            reason:
              aiVerification.reason ||
              "",

            result:
              "passed",
          },

          status:
            "reported",

          createdAt:
            serverTimestamp(),
        };

        await addDoc(
          collection(
            db,
            "reports"
          ),
          reportData
        );

        // Stop camera just in case
        stopCamera();

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
                  Your photo was analyzed and
                  your complaint details passed
                  the AI consistency check.
                </p>

                <button
                  className="btn btn-primary mt-3"
                  onClick={() => {
                    stopCamera();

                    navigate(
                      "/citizen/dashboard"
                    );
                  }}
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

          {/* BACK */}

          <button
            className="btn btn-link p-0 text-decoration-none mb-4"
            onClick={() => {
              stopCamera();
              navigate(-1);
            }}
          >
            ← Back
          </button>

          <div className="card shadow-sm border-0">

            <div className="card-body p-4">

              <h2 className="fw-bold mb-1">
                Report a Live Issue
              </h2>

              <p className="text-muted mb-4">
                Capture the issue now. AI will
                first analyze the photo, then
                verify your complaint details
                against the evidence.
              </p>

              {/* ==================================================
                  LOCATION
              ================================================== */}

              <div className="card mb-4">

                <div className="card-body">

                  <h6 className="fw-bold mb-3">
                    📍 Location Details
                  </h6>

                  {locationLoading ? (

                    <div className="alert alert-info mb-0">

                      <div className="d-flex align-items-center">

                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        />

                        Getting your current
                        location...

                      </div>

                    </div>

                  ) : location ? (

                    <div className="border rounded p-3">

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          AREA
                        </small>

                        <strong>
                          {location.area ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          CITY
                        </small>

                        <strong>
                          {location.city ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          DISTRICT
                        </small>

                        <strong>
                          {location.district ||
                            "Not available"}
                        </strong>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block">
                          STATE
                        </small>

                        <strong>
                          {location.state ||
                            "Not available"}
                        </strong>
                      </div>

                      <hr />

                      <small className="text-muted">
                        GPS:{" "}
                        {location.latitude},{" "}
                        {location.longitude}

                        <br />

                        Accuracy:{" "}
                        {Math.round(
                          location.accuracy
                        )}
                        m
                      </small>

                    </div>

                  ) : (

                    <div>

                      {locationError && (
                        <div className="alert alert-danger">
                          {locationError}
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={
                          getLocation
                        }
                      >
                        📍 Get Current Location
                      </button>

                    </div>

                  )}

                  {location &&
                    locationError && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mt-3"
                        onClick={
                          getLocation
                        }
                      >
                        🔄 Retry Location
                      </button>
                    )}

                </div>

              </div>

              {/* ==================================================
                  CAMERA
              ================================================== */}

              <div className="card mb-4">

                <div className="card-body">

                  <div className="d-flex justify-content-between align-items-center">

                    <h6 className="fw-bold mb-0">
                      📷 Capture Evidence
                    </h6>

                    <span className="badge text-bg-warning">
                      Required
                    </span>

                  </div>

                  <p className="text-muted small mt-2">
                    Take a fresh photo of the issue.
                    AI will analyze the image
                    immediately after capture.
                  </p>

                  {!photo &&
                    !cameraActive && (
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100 mt-3"
                        onClick={
                          startCamera
                        }
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
                          maxHeight:
                            "400px",
                          objectFit:
                            "cover",
                          background:
                            "#000",
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-primary w-100 mt-3"
                        onClick={
                          capturePhoto
                        }
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
                          maxHeight:
                            "400px",
                          objectFit:
                            "cover",
                        }}
                      />

                      <button
                        type="button"
                        className="btn btn-outline-secondary w-100 mt-3"
                        onClick={
                          retakePhoto
                        }
                        disabled={
                          imageUploading ||
                          aiChecking
                        }
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

              {/* ==================================================
                  AI IMAGE ANALYSIS
              ================================================== */}

              {(imageUploading ||
                aiChecking ||
                aiImageAnalysis) && (

                <div className="card border-primary mb-4">

                  <div className="card-body">

                    <h6 className="fw-bold">
                      🤖 AI Image Analysis
                    </h6>

                    {imageUploading && (
                      <div className="alert alert-info mt-3 mb-0">

                        <div className="d-flex align-items-center">

                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          />

                          Uploading evidence
                          securely...

                        </div>

                      </div>
                    )}

                    {!imageUploading &&
                      aiChecking &&
                      !aiImageAnalysis && (
                        <div className="alert alert-info mt-3 mb-0">

                          <div className="d-flex align-items-center">

                            <div
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            />

                            <strong>
                              AI is analyzing
                              the photo...
                            </strong>

                          </div>

                        </div>
                      )}

                    {aiImageAnalysis && (
                      <div className="mt-3">

                        <div className="alert alert-success">

                          <h6 className="fw-bold mb-2">
                            ✓ Photo Analysis
                            Complete
                          </h6>

                          <div>
                            <strong>
                              Detected issue:
                            </strong>{" "}
                            {aiImageAnalysis
                              .detectedIssue ||
                              "Unable to determine"}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Suggested category:
                            </strong>{" "}
                            {aiImageAnalysis
                              .suggestedCategory ||
                              "Other"}
                          </div>

                          <div className="mt-1">
                            <strong>
                              Visual confidence:
                            </strong>{" "}
                            {aiImageAnalysis
                              .confidence ??
                              0}
                            %
                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* ==================================================
                  ISSUE INFORMATION
              ================================================== */}

              <form onSubmit={handleSubmit}>

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

                    <div className="mb-3">

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

                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={
                        runFullAICheck
                      }
                      disabled={
                        !imageUrl ||
                        !category ||
                        !description.trim() ||
                        imageUploading ||
                        aiChecking
                      }
                    >
                      {aiChecking
                        ? "🤖 Verifying Complaint..."
                        : "🤖 Verify Complaint with AI"}
                    </button>

                  </div>

                </div>

                {/* ==================================================
                    AI VERIFICATION
                ================================================== */}

                {aiVerification && (
                  <div className="card mb-4">

                    <div className="card-body">

                      <h6 className="fw-bold">
                        🤖 AI Complaint Verification
                      </h6>

                      {aiVerification.approved ? (

                        <div className="alert alert-success mt-3 mb-0">

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
                              {aiVerification.score ??
                                0}
                              %
                            </strong>
                          </div>

                          {aiVerification.reason && (
                            <small className="d-block mt-2">
                              {aiVerification.reason}
                            </small>
                          )}

                        </div>

                      ) : (

                        <div className="alert alert-warning mt-3 mb-0">

                          <h6 className="fw-bold">
                            ⚠ Review Required
                          </h6>

                          {aiVerification.reason && (
                            <div>
                              <strong>
                                AI reason:
                              </strong>{" "}
                              {aiVerification.reason}
                            </div>
                          )}

                          <div className="mt-2">
                            Consistency score:{" "}
                            <strong>
                              {aiVerification.score ??
                                0}
                              %
                            </strong>
                          </div>

                        </div>

                      )}

                    </div>

                  </div>
                )}

                {/* ==================================================
                    INFO
                ================================================== */}

                <div className="alert alert-info">

                  <small>
                    ℹ AI first analyzes the captured
                    photo. After you provide the
                    category and description, AI
                    checks whether those details appear
                    consistent with the visual evidence.
                    AI verification is not proof that
                    the complaint is factually true.
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
                    !aiVerification?.approved ||
                    !aiVerification?.categoryMatch ||
                    !aiVerification?.descriptionMatch
                  }
                >
                  {loading
                    ? "Submitting..."
                    : imageUploading
                    ? "Uploading Evidence..."
                    : aiChecking
                    ? "AI Checking..."
                    : !aiImageAnalysis
                    ? "Analyze Photo First"
                    : !aiVerification?.approved
                    ? "Verify Complaint First"
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