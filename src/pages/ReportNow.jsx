import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportNow() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [cameraActive, setCameraActive] = useState(false);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // GET CURRENT LOCATION
  // ==========================================

  function getCurrentLocation() {
    setError("");
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by your browser."
      );
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
          accuracy,
        } = position.coords;

        setLocation({
          latitude,
          longitude,
          accuracy,
        });

        setLoadingLocation(false);
      },

      (error) => {
        setLoadingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Location permission was denied. Please allow location access and try again."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setError(
              "Your current location could not be determined."
            );
            break;

          case error.TIMEOUT:
            setError(
              "Location request timed out. Please try again."
            );
            break;

          default:
            setError(
              "Unable to get your current location."
            );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // ==========================================
  // START CAMERA
  // ==========================================

  async function startCamera() {
    setError("");
    setLoadingCamera(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      // Laptop-friendly camera settings
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

      streamRef.current = stream;

      console.log("Camera stream:", stream);
      console.log(
        "Camera tracks:",
        stream.getVideoTracks()
      );

      setCameraActive(true);

      // Wait until video element exists
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .catch((err) => {
                console.error(
                  "Video play error:",
                  err
                );
              });
          };
        }
      }, 100);

    } catch (err) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission was denied. Please allow camera access in your browser."
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No camera was found on this device."
        );
      } else if (err.name === "NotReadableError") {
        setError(
          "The camera is already being used by another application."
        );
      } else if (err.name === "OverconstrainedError") {
        setError(
          "The requested camera configuration is not available."
        );
      } else {
        setError(
          err.message ||
            "Unable to access the camera."
        );
      }
    } finally {
      setLoadingCamera(false);
    }
  }

  // ==========================================
  // CAPTURE PHOTO
  // ==========================================

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera is not ready.");
      return;
    }

    if (
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      setError(
        "Camera is still starting. Please wait a moment and try again."
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the image.");
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

    stopCamera();

    setError("");
  }

  // ==========================================
  // STOP CAMERA
  // ==========================================

  function stopCamera() {
    if (streamRef.current) {
      const tracks =
        streamRef.current.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }

  // ==========================================
  // RETAKE PHOTO
  // ==========================================

  function retakePhoto() {
    setPhoto(null);
    startCamera();
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="container py-5">

      {/* ================================
          HEADER
      ================================= */}

      <div className="mb-4">

        <button
          type="button"
          className="btn btn-outline-secondary mb-3"
          onClick={() =>
            navigate("/citizen/dashboard")
          }
        >
          ← Back to Dashboard
        </button>

        <h2 className="fw-bold">
          Report Now
        </h2>

        <p className="text-muted">
          Report an infrastructure problem
          happening right now.
        </p>

      </div>

      {/* ================================
          ERROR MESSAGE
      ================================= */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* ================================
          LOCATION CARD
      ================================= */}

      <div className="card shadow-sm mb-4">

        <div className="card-body p-4">

          <h5 className="fw-bold mb-3">
            📍 Current Location
          </h5>

          <p className="text-muted">
            Your current location will be
            captured automatically for this
            report.
          </p>

          {/* GET LOCATION BUTTON */}

          {!location && (
            <button
              type="button"
              className="btn btn-dark"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation
                ? "Getting Location..."
                : "Use My Current Location"}
            </button>
          )}

          {/* LOCATION SUCCESS */}

          {location && (
            <div className="alert alert-success mb-0">

              <h6 className="fw-bold">
                ✓ Location Captured
              </h6>

              <div className="mt-2">
                <strong>
                  Latitude:
                </strong>{" "}
                {location.latitude.toFixed(6)}
              </div>

              <div>
                <strong>
                  Longitude:
                </strong>{" "}
                {location.longitude.toFixed(6)}
              </div>

              <div>
                <strong>
                  Accuracy:
                </strong>{" "}
                {Math.round(
                  location.accuracy
                )}{" "}
                meters
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ================================
          CAMERA CARD
      ================================= */}

      <div className="card shadow-sm">

        <div className="card-body p-4">

          <h5 className="fw-bold mb-3">
            📷 Fresh Evidence
          </h5>

          <p className="text-muted">
            Take a new photo of the
            infrastructure problem using
            your camera.
          </p>

          {/* ============================
              LIVE CAMERA
          ============================= */}

          {cameraActive && (
            <div>

              <div
                className="bg-dark rounded overflow-hidden mb-3"
                style={{
                  width: "100%",
                  minHeight: "300px",
                }}
              >

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100"
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: "500px",
                    objectFit: "cover",
                  }}
                />

              </div>

              <div className="d-flex gap-2">

                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={capturePhoto}
                >
                  📸 Take Photo
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={stopCamera}
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

          {/* ============================
              OPEN CAMERA
          ============================= */}

          {!cameraActive && !photo && (
            <button
              type="button"
              className="btn btn-dark"
              onClick={startCamera}
              disabled={loadingCamera}
            >
              {loadingCamera
                ? "Opening Camera..."
                : "📷 Capture Evidence"}
            </button>
          )}

          {/* ============================
              PHOTO PREVIEW
          ============================= */}

          {photo && (
            <div>

              <img
                src={photo}
                alt="Captured infrastructure evidence"
                className="img-fluid rounded"
                style={{
                  width: "100%",
                  maxHeight: "500px",
                  objectFit: "cover",
                }}
              />

              <div className="alert alert-success mt-3">
                ✓ Fresh camera evidence captured.
              </div>

              <button
                type="button"
                className="btn btn-outline-dark"
                onClick={retakePhoto}
              >
                📷 Retake Photo
              </button>

            </div>
          )}

          {/* ============================
              HIDDEN CANVAS
          ============================= */}

          <canvas
            ref={canvasRef}
            style={{
              display: "none",
            }}
          />

        </div>

      </div>

    </div>
  );
}

export default ReportNow;