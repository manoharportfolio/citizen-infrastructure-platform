import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportSomething() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: "",
    time: "",
    location: "",
    category: "",
    description: "",
  });

  const [evidence, setEvidence] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ================================
  // HANDLE INPUT
  // ================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ================================
  // HANDLE EVIDENCE
  // ================================

  function handleEvidenceChange(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    setEvidence(file);
  }

  // ================================
  // REMOVE EVIDENCE
  // ================================

  function removeEvidence() {
    setEvidence(null);
  }

  // ================================
  // SUBMIT
  // ================================

  function handleSubmit(e) {
    e.preventDefault();

    console.log("Report Something I Saw:", {
      ...form,
      evidence,
    });

    setSubmitted(true);
  }

  // ================================
  // SUCCESS SCREEN
  // ================================

  if (submitted) {
    return (
      <div className="container py-5">

        <div className="card shadow-sm">
          <div className="card-body text-center p-5">

            <div
              className="mb-3"
              style={{
                fontSize: "50px",
              }}
            >
              ✓
            </div>

            <h2 className="fw-bold">
              Observation Recorded
            </h2>

            <p className="text-muted">
              Your observation has been recorded.
              It can be used with other citizen
              reports to identify infrastructure
              problems and demand hotspots.
            </p>

            <button
              type="button"
              className="btn btn-dark mt-3"
              onClick={() =>
                navigate("/citizen/dashboard")
              }
            >
              Back to Dashboard
            </button>

          </div>
        </div>

      </div>
    );
  }

  // ================================
  // MAIN PAGE
  // ================================

  return (
    <div className="container py-5">

      {/* HEADER */}

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
          Report Something I Saw
        </h2>

        <p className="text-muted">
          Report an infrastructure problem you
          noticed earlier.
        </p>

      </div>

      {/* INFORMATION */}

      <div className="alert alert-info">
        <strong>Note:</strong> This report is for
        something you observed earlier. You can
        provide the approximate location and time
        of your observation.
      </div>

      {/* FORM */}

      <div className="card shadow-sm">

        <div className="card-body p-4">

          <form onSubmit={handleSubmit}>

            {/* ============================
                DATE
            ============================= */}

            <div className="mb-3">

              <label
                htmlFor="date"
                className="form-label fw-semibold"
              >
                When did you see it?
              </label>

              <input
                type="date"
                id="date"
                name="date"
                className="form-control"
                value={form.date}
                onChange={handleChange}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                required
              />

            </div>

            {/* ============================
                TIME
            ============================= */}

            <div className="mb-3">

              <label
                htmlFor="time"
                className="form-label fw-semibold"
              >
                Approximate time
              </label>

              <input
                type="time"
                id="time"
                name="time"
                className="form-control"
                value={form.time}
                onChange={handleChange}
                required
              />

            </div>

            {/* ============================
                LOCATION
            ============================= */}

            <div className="mb-3">

              <label
                htmlFor="location"
                className="form-label fw-semibold"
              >
                Where did you see it?
              </label>

              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                placeholder="Example: Near ABC School, Kukatpally"
                value={form.location}
                onChange={handleChange}
                required
              />

              <div className="form-text">
                Enter the place or landmark where
                you observed the problem.
              </div>

            </div>

            {/* ============================
                CATEGORY
            ============================= */}

            <div className="mb-3">

              <label
                htmlFor="category"
                className="form-label fw-semibold"
              >
                What type of problem was it?
              </label>

              <select
                id="category"
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select a category
                </option>

                <option value="Road Damage">
                  Road Damage / Pothole
                </option>

                <option value="Garbage">
                  Garbage / Waste
                </option>

                <option value="Footpath">
                  Damaged Footpath
                </option>

                <option value="Streetlight">
                  Streetlight Problem
                </option>

                <option value="Water">
                  Water Supply Problem
                </option>

                <option value="Drainage">
                  Drainage / Sewage
                </option>

                <option value="Public Transport">
                  Public Transport Problem
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            {/* ============================
                DESCRIPTION
            ============================= */}

            <div className="mb-3">

              <label
                htmlFor="description"
                className="form-label fw-semibold"
              >
                What did you see?
              </label>

              <textarea
                id="description"
                name="description"
                className="form-control"
                rows="5"
                placeholder="Describe what you observed..."
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                required
              />

              <div className="form-text">
                Maximum 1000 characters.
              </div>

            </div>

            {/* ============================
                OPTIONAL EVIDENCE
            ============================= */}

            <div className="mb-4">

              <label
                htmlFor="evidence"
                className="form-label fw-semibold"
              >
                Optional Evidence
              </label>

              <input
                type="file"
                id="evidence"
                className="form-control"
                accept="image/*"
                onChange={handleEvidenceChange}
              />

              <div className="form-text">
                You may provide a photo if you
                already have one.
              </div>

            </div>

            {/* EVIDENCE PREVIEW */}

            {evidence && (
              <div className="alert alert-secondary">

                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <strong>
                      Evidence selected:
                    </strong>

                    <br />

                    <span>
                      {evidence.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={removeEvidence}
                  >
                    Remove
                  </button>

                </div>

              </div>
            )}

            {/* ============================
                SUBMIT
            ============================= */}

            <button
              type="submit"
              className="btn btn-dark w-100"
            >
              Submit Observation
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default ReportSomething;