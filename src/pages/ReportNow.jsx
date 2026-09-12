import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportNow() {
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getCurrentLocation() {
    setError("");
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setLocation({
          latitude,
          longitude,
          accuracy,
        });

        setLoading(false);
      },
      (error) => {
        setLoading(false);

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
            setError("Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="container py-5">

      <div className="mb-4">
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate("/citizen/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h2 className="fw-bold">
          Report Now
        </h2>

        <p className="text-muted">
          Report an infrastructure problem happening right now.
        </p>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">

          <h5 className="fw-bold mb-3">
            📍 Current Location
          </h5>

          <p className="text-muted">
            Your current location will be captured automatically
            for this report.
          </p>

          {!location && (
            <button
              className="btn btn-dark"
              onClick={getCurrentLocation}
              disabled={loading}
            >
              {loading
                ? "Getting Location..."
                : "Use My Current Location"}
            </button>
          )}

          {error && (
            <div className="alert alert-danger mt-3">
              {error}
            </div>
          )}

          {location && (
            <div className="alert alert-success mt-3">

              <h6 className="fw-bold">
                ✓ Location Captured
              </h6>

              <div className="mt-3">
                <strong>Latitude:</strong>{" "}
                {location.latitude.toFixed(6)}
              </div>

              <div>
                <strong>Longitude:</strong>{" "}
                {location.longitude.toFixed(6)}
              </div>

              <div>
                <strong>Accuracy:</strong>{" "}
                {Math.round(location.accuracy)} meters
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default ReportNow;