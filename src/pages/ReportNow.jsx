import { useEffect, useRef, useState } from "react";
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

function ReportNow() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [photo, setPhoto] = useState(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // GET CURRENT LOCATION
  // --------------------------------------------------

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
          setLocationError("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

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

      // Give React time to render the video element
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
        setCameraError("Unable to access the camera.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const capturePhoto = () => {
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
  };

  const retakePhoto = async () => {
    setPhoto(null);
    await startCamera();
  };

  // --------------------------------------------------
  // CONVERT DATA URL TO FILE
  // --------------------------------------------------

  const dataURLToBlob = async (dataURL) => {
    const response = await fetch(dataURL);
    return await response.blob();
  };

  // --------------------------------------------------
  // INITIAL SETUP
  // --------------------------------------------------

  useEffect(() => {
    getLocation();
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // --------------------------------------------------
  // SUBMIT REPORT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Check authentication
    if (!auth.currentUser) {
      setError("You must be logged in to submit a report.");
      return;
    }

    // Check location
    if (!location) {
      setError(
        "Current location is required. Please allow location access."
      );
      return;
    }

    // Check category
    if (!category) {
      setError("Please select an issue category.");
      return;
    }

    // Check description
    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    // Camera evidence is required for Report Now
    if (!photo) {
      setError(
        "Please capture a photo of the issue using the camera."
      );
      return;
    }

    try {
      setLoading(true);

      // ----------------------------------------------
      // STEP 1: CREATE REPORT IN FIRESTORE
      // ----------------------------------------------

      const reportData = {
        userId: auth.currentUser.uid,

        reportType: "report-now",

        category: category,

        description: description.trim(),

        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },

        evidence: {
          hasImage: true,
          imageUrl: null,
          fileName: "citizen-evidence.jpg",
          fileType: "image/jpeg",
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
      // STEP 2: CONVERT CAMERA PHOTO TO FILE
      // ----------------------------------------------

      const imageBlob = await dataURLToBlob(photo);

      const imageFile = new File(
        [imageBlob],
        "citizen-evidence.jpg",
        {
          type: "image/jpeg",
        }
      );

      // ----------------------------------------------
      // STEP 3: UPLOAD IMAGE TO IMAGEKIT
      // ----------------------------------------------

      const uploadedImage = await uploadImage(
        imageFile,
        `/citizen-reports/${auth.currentUser.uid}/${reportRef.id}`
      );

      console.log(
        "ImageKit upload successful:",
        uploadedImage
      );

      // ----------------------------------------------
      // STEP 4: SAVE IMAGEKIT URL IN FIRESTORE
      // ----------------------------------------------

      await updateDoc(
        doc(db, "reports", reportRef.id),
        {
          "evidence.imageUrl": uploadedImage.url,
          "evidence.fileId": uploadedImage.fileId,
        }
      );

      console.log(
        "Report updated with ImageKit URL."
      );

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
                  Your infrastructure complaint has
                  been successfully submitted.
                </p>

                <p className="small text-muted">
                  Your location and evidence have been
                  recorded for further verification.
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
  // UI
  // --------------------------------------------------

  return (
    <div className="container py-4">

      <div className="row justify-content-center">
        <div className="col-lg-8">

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

          <div className="card shadow-sm border-0">

            <div className="card-body p-4">

              <h2 className="fw-bold mb-2">
                Report Now
              </h2>

              <p className="text-muted mb-4">
                Report an infrastructure problem
                happening at your current location.
              </p>

              {/* LOCATION */}

              <div className="card bg-light border-0 mb-4">
                <div className="card-body">

                  <h5 className="fw-bold">
                    📍 Current Location
                  </h5>

                  {location ? (
                    <div className="mt-2">
                      <div>
                        <strong>Latitude:</strong>{" "}
                        {location.latitude}
                      </div>

                      <div>
                        <strong>Longitude:</strong>{" "}
                        {location.longitude}
                      </div>

                      <div>
                        <strong>Accuracy:</strong>{" "}
                        {Math.round(
                          location.accuracy
                        )}{" "}
                        meters
                      </div>

                      <div className="text-success mt-2">
                        ✓ Location captured
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted mb-2">
                        Waiting for your location...
                      </p>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={getLocation}
                      >
                        Get Location Again
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

              {/* CAMERA */}

              <div className="mb-4">

                <h5 className="fw-bold mb-2">
                  📷 Evidence Photo
                </h5>

                <p className="text-muted small">
                  Take a fresh photo of the issue.
                  Gallery uploads are not allowed in
                  Report Now.
                </p>

                {cameraActive && (
                  <div className="mb-3">

                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-100 rounded border"
                      style={{
                        maxHeight: "450px",
                        objectFit: "cover",
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-primary mt-3 w-100"
                      onClick={capturePhoto}
                    >
                      📸 Capture Photo
                    </button>

                  </div>
                )}

                {photo && (
                  <div>

                    <img
                      src={photo}
                      alt="Captured evidence"
                      className="img-fluid rounded border"
                      style={{
                        maxHeight: "450px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary mt-3 w-100"
                      onClick={retakePhoto}
                    >
                      🔄 Retake Photo
                    </button>

                  </div>
                )}

                {!cameraActive && !photo && (
                  <button
                    type="button"
                    className="btn btn-outline-primary w-100"
                    onClick={startCamera}
                  >
                    📷 Open Camera
                  </button>
                )}

                {cameraError && (
                  <div className="alert alert-danger mt-3">
                    {cameraError}
                  </div>
                )}

              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>

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
                    placeholder="Describe what is happening..."
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
                >
                  {loading
                    ? "Submitting Report..."
                    : "Submit Report"}
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