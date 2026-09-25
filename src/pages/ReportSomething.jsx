import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  auth,
} from "../firebase/config";

import {
  uploadImage,
} from "../services/imageService";

import {
  createReport,
} from "../services/reportService";


// ============================================================
// CONSTANTS
// ============================================================

const CATEGORIES = [
  "Road Damage",
  "Garbage",
  "Footpath",
  "Streetlight",
  "Water",
  "Drainage",
  "Public Transport",
  "Other",
];

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";


// ============================================================
// COMPONENT
// ============================================================

function ReportSomething() {
  const navigate =
    useNavigate();


  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  const [
    state,
    setState,
  ] = useState("");

  const [
    district,
    setDistrict,
  ] = useState("");

  const [
    city,
    setCity,
  ] = useState("");

  const [
    area,
    setArea,
  ] = useState("");

  const [
    observedDate,
    setObservedDate,
  ] = useState("");

  const [
    observedTime,
    setObservedTime,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");


  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  const [
    imageUrl,
    setImageUrl,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);


  // ----------------------------------------------------------
  // AI
  // ----------------------------------------------------------

  const [
    aiImageAnalysis,
    setAiImageAnalysis,
  ] = useState(null);

  const [
    aiVerification,
    setAiVerification,
  ] = useState(null);

  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  const [
    aiError,
    setAiError,
  ] = useState("");


  // ----------------------------------------------------------
  // SUBMISSION
  // ----------------------------------------------------------

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {
    if (!auth.currentUser) {
      navigate(
        "/citizen/login",
        {
          replace: true,
        }
      );
    }
  }, [navigate]);


  // ==========================================================
  // CLEAN IMAGE PREVIEW
  // ==========================================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);


  // ==========================================================
  // HANDLE IMAGE SELECT
  // ==========================================================

  function handleImageChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    setAiImageAnalysis(null);
    setAiVerification(null);
    setAiError("");
    setImageUrl("");

    if (!file) {
      setSelectedFile(null);
      setImagePreview("");
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setErrorMessage(
        "Please select a valid image file."
      );

      setSelectedFile(null);
      setImagePreview("");
      return;
    }


    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setErrorMessage(
        "Image size must be 10 MB or less."
      );

      setSelectedFile(null);
      setImagePreview("");
      return;
    }


    setErrorMessage(
      ""
    );

    setSelectedFile(
      file
    );

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setImagePreview(
      previewUrl
    );
  }


  // ==========================================================
  // UPLOAD IMAGE
  // ==========================================================

  async function handleUploadImage() {
    if (!selectedFile) {
      setErrorMessage(
        "Please select an image first."
      );
      return;
    }


    try {
      setUploading(true);
      setErrorMessage("");
      setAiError("");
      setAiImageAnalysis(null);
      setAiVerification(null);


      const result =
        await uploadImage(
          selectedFile,
          "civicai/reported-observations"
        );


      setImageUrl(
        result.url
      );

      setSuccessMessage(
        "Evidence image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to upload image."
      );

      setImageUrl("");
    } finally {
      setUploading(false);
    }
  }


  // ==========================================================
  // RUN IMAGE-ONLY AI ANALYSIS
  // ==========================================================

  async function runImageAnalysis(
    url
  ) {
    if (!url) {
      return null;
    }


    const response =
      await fetch(
        `${API_URL}/api/ai/analyze-complaint`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            imageUrl:
              url,

            category:
              category.trim(),

            description:
              description.trim(),

            mode:
              "image-only",
          }),
        }
      );


    let data;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        "AI service returned an invalid response."
      );
    }


    if (!response.ok) {
      throw new Error(
        data.message ||
          "AI image analysis failed."
      );
    }


    const analysis =
      data.imageAssessment ||
      data.analysis ||
      data.result;


    if (!analysis) {
      throw new Error(
        "AI did not return an image assessment."
      );
    }


    const normalized = {
      detectedIssue:
        String(
          analysis.detectedIssue ||
            analysis.imageDetectedIssue ||
            ""
        ).trim(),

      suggestedCategory:
        analysis.suggestedCategory ||
        category ||
        "Other",

      confidence:
        Number(
          analysis.confidence ??
            analysis.visualConfidence ??
            0
        ),

      observations:
        Array.isArray(
          analysis.observations
        )
          ? analysis.observations
          : [],
    };


    setAiImageAnalysis(
      normalized
    );


    return normalized;
  }


  // ==========================================================
  // RUN FULL AI CONSISTENCY CHECK
  // ==========================================================

  async function runFullAICheck(
    url
  ) {
    if (!url) {
      return null;
    }


    try {
      setAiLoading(true);
      setAiError("");


      const imageAnalysis =
        await runImageAnalysis(
          url
        );


      const response =
        await fetch(
          `${API_URL}/api/ai/analyze-complaint`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              imageUrl:
                url,

              category:
                category.trim(),

              description:
                description.trim(),

              mode:
                "full-check",
            }),
          }
        );


      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "AI service returned an invalid response."
        );
      }


      if (!response.ok) {
        throw new Error(
          data.message ||
            "AI consistency check failed."
        );
      }


      const consistency =
        data.consistency ||
        data.analysis ||
        data.result;


      if (!consistency) {
        throw new Error(
          "AI did not return a consistency assessment."
        );
      }


      const normalized =
        {
          detectedIssue:
            String(
              consistency.detectedIssue ||
                imageAnalysis?.detectedIssue ||
                ""
            ).trim(),

          categoryMatch:
            Boolean(
              consistency.categoryMatch
            ),

          descriptionMatch:
            Boolean(
              consistency.descriptionMatch
            ),

          score:
            Number(
              consistency.score ??
                consistency.consistencyScore ??
                0
            ),

          approved:
            Boolean(
              consistency.approved
            ),

          reason:
            String(
              consistency.reason ||
                ""
            ).trim(),
        };


      setAiVerification(
        normalized
      );


      return normalized;
    } catch (error) {
      console.error(
        "AI analysis error:",
        error
      );

      setAiError(
        error.message ||
          "AI analysis failed."
      );

      return null;
    } finally {
      setAiLoading(false);
    }
  }


  // ==========================================================
  // AUTOMATIC AI CHECK AFTER UPLOAD
  // ==========================================================

  useEffect(() => {
    if (!imageUrl) {
      return;
    }


    if (!category.trim()) {
      return;
    }


    if (!description.trim()) {
      return;
    }


    const timer =
      setTimeout(() => {
        runFullAICheck(
          imageUrl
        );
      }, 800);


    return () => {
      clearTimeout(
        timer
      );
    };
  }, [
    imageUrl,
    category,
    description,
  ]);


  // ==========================================================
  // VALIDATION
  // ==========================================================

  function validateForm() {
    if (!state.trim()) {
      return "State is required.";
    }

    if (!district.trim()) {
      return "District is required.";
    }

    if (!city.trim()) {
      return "City is required.";
    }

    if (!area.trim()) {
      return "Area is required.";
    }

    if (!observedDate) {
      return "Date observed is required.";
    }

    if (!observedTime) {
      return "Time observed is required.";
    }

    if (!category) {
      return "Please select a complaint category.";
    }

    if (!description.trim()) {
      return "Please describe what you observed.";
    }

    if (
      description.trim().length <
      10
    ) {
      return "Please provide a little more detail about the issue.";
    }

    if (!imageUrl) {
      return "Please upload evidence of the issue.";
    }

    return "";
  }


  // ==========================================================
  // SUBMIT REPORT
  // ==========================================================

  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    setSuccessMessage("");
    setErrorMessage("");


    const validationError =
      validateForm();


    if (validationError) {
      setErrorMessage(
        validationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }


    if (!auth.currentUser) {
      navigate(
        "/citizen/login"
      );

      return;
    }


    try {
      setSubmitting(true);


      let finalImageAnalysis =
        aiImageAnalysis;

      let finalVerification =
        aiVerification;


      // Run AI if it has not completed yet.
      if (
        !finalImageAnalysis ||
        !finalVerification
      ) {
        finalVerification =
          await runFullAICheck(
            imageUrl
          );

        finalImageAnalysis =
          aiImageAnalysis;
      }


      const reportData =
        {
          reportType:
            "reported-observation",

          category:
            category.trim(),

          description:
            description.trim(),

          observedAt:
            `${observedDate}T${observedTime}`,

          location: {
            state:
              state.trim(),

            district:
              district.trim(),

            city:
              city.trim(),

            area:
              area.trim(),

            latitude:
              null,

            longitude:
              null,

            accuracy:
              null,

            approximateLocation:
              true,
          },

          evidence: {
            imageUrl:
              imageUrl,

            imageFileId:
              null,

            source:
              "citizen-upload",

            capturedAt:
              new Date().toISOString(),
          },

          aiAnalysis: {
            checked:
              true,

            detectedIssue:
              finalImageAnalysis?.detectedIssue ||
              finalVerification?.detectedIssue ||
              "",

            suggestedCategory:
              finalImageAnalysis?.suggestedCategory ||
              category.trim(),

            confidence:
              Number(
                finalImageAnalysis?.confidence ??
                  0
              ),

            observations:
              Array.isArray(
                finalImageAnalysis?.observations
              )
                ? finalImageAnalysis.observations
                : [],

            categoryMatch:
              finalVerification?.categoryMatch ??
              false,

            descriptionMatch:
              finalVerification?.descriptionMatch ??
              false,

            consistencyScore:
              Number(
                finalVerification?.score ??
                  0
              ),

            reason:
              finalVerification?.reason ||
              "",

            result:
              finalVerification?.approved
                ? "passed"
                : "review",
          },
        };


      const result =
        await createReport(
          reportData
        );


      setSuccessMessage(
        "Your report has been submitted successfully."
      );


      // Reset form.
      setState("");
      setDistrict("");
      setCity("");
      setArea("");
      setObservedDate("");
      setObservedTime("");
      setCategory("");
      setDescription("");
      setSelectedFile(null);
      setImagePreview("");
      setImageUrl("");
      setAiImageAnalysis(null);
      setAiVerification(null);


      // Move user to their reports.
      setTimeout(() => {
        navigate(
          "/citizen/my-reports"
        );
      }, 1200);


      return result;
    } catch (error) {
      console.error(
        "Report submission error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to submit your report."
      );
    } finally {
      setSubmitting(false);
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-9">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-4">
            <Link
              to="/citizen/dashboard"
              className="btn btn-outline-secondary mb-3"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="fw-bold mb-2">
              Report Something I Saw
            </h1>

            <p className="text-secondary mb-0">
              Report a public issue you observed earlier.
              Add the location, observation time, description,
              and supporting evidence.
            </p>
          </div>


          {/* ==================================================
              ALERTS
          ================================================== */}

          {errorMessage && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {errorMessage}
            </div>
          )}


          {successMessage && (
            <div
              className="alert alert-success"
              role="alert"
            >
              {successMessage}
            </div>
          )}


          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* =================================================
                LOCATION
            ================================================= */}

            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">

                <h4 className="fw-bold mb-1">
                  Where did you see it?
                </h4>

                <p className="text-secondary mb-4">
                  Enter the location manually. GPS is not
                  required for an earlier observation.
                </p>


                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      State *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={state}
                      onChange={(event) =>
                        setState(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Telangana"
                      required
                    />
                  </div>


                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      District *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={district}
                      onChange={(event) =>
                        setDistrict(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Hyderabad"
                      required
                    />
                  </div>


                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      City *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={city}
                      onChange={(event) =>
                        setCity(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Hyderabad"
                      required
                    />
                  </div>


                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Area *
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={area}
                      onChange={(event) =>
                        setArea(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Bahadurpura"
                      required
                    />
                  </div>

                </div>

              </div>
            </div>


            {/* =================================================
                OBSERVATION TIME
            ================================================= */}

            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">

                <h4 className="fw-bold mb-1">
                  When did you see it?
                </h4>

                <p className="text-secondary mb-4">
                  Provide the date and approximate time when
                  you observed the issue.
                </p>


                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Date Observed *
                    </label>

                    <input
                      type="date"
                      className="form-control"
                      value={
                        observedDate
                      }
                      onChange={(event) =>
                        setObservedDate(
                          event.target.value
                        )
                      }
                      max={
                        new Date()
                          .toISOString()
                          .split("T")[0]
                      }
                      required
                    />
                  </div>


                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Time Observed *
                    </label>

                    <input
                      type="time"
                      className="form-control"
                      value={
                        observedTime
                      }
                      onChange={(event) =>
                        setObservedTime(
                          event.target.value
                        )
                      }
                      required
                    />
                  </div>

                </div>

              </div>
            </div>


            {/* =================================================
                COMPLAINT DETAILS
            ================================================= */}

            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">

                <h4 className="fw-bold mb-4">
                  What did you observe?
                </h4>


                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Category *
                  </label>

                  <select
                    className="form-select"
                    value={
                      category
                    }
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select a category
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


                <div>
                  <label className="form-label fw-semibold">
                    Description *
                  </label>

                  <textarea
                    className="form-control"
                    rows="5"
                    value={
                      description
                    }
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe what you saw, where it was, and what appeared to be wrong."
                    required
                  />

                  <div className="form-text">
                    Minimum 10 characters.
                  </div>
                </div>

              </div>
            </div>


            {/* =================================================
                EVIDENCE
            ================================================= */}

            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">

                <h4 className="fw-bold mb-1">
                  Evidence
                </h4>

                <p className="text-secondary mb-4">
                  Upload a photo showing the issue you
                  observed.
                </p>


                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Evidence Image *
                  </label>

                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                  />

                  <div className="form-text">
                    JPG, PNG, WEBP or another supported
                    image format. Maximum 10 MB.
                  </div>
                </div>


                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={
                        imagePreview
                      }
                      alt="Evidence preview"
                      className="img-fluid rounded border"
                      style={{
                        maxHeight:
                          "420px",
                        objectFit:
                          "contain",
                      }}
                    />
                  </div>
                )}


                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={
                    handleUploadImage
                  }
                  disabled={
                    !selectedFile ||
                    uploading ||
                    submitting
                  }
                >
                  {uploading
                    ? "Uploading..."
                    : imageUrl
                    ? "Upload Again"
                    : "Upload Evidence"}
                </button>


                {imageUrl && (
                  <div className="alert alert-success mt-3 mb-0">
                    Evidence image uploaded successfully.
                  </div>
                )}

              </div>
            </div>


            {/* =================================================
                AI ANALYSIS
            ================================================= */}

            {imageUrl && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h4 className="fw-bold mb-1">
                        AI Evidence Analysis
                      </h4>

                      <p className="text-secondary mb-0">
                        AI checks whether the submitted
                        evidence is visually consistent with
                        your report.
                      </p>
                    </div>

                    {aiLoading && (
                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Analyzing...
                        </span>
                      </div>
                    )}
                  </div>


                  {aiError && (
                    <div className="alert alert-warning">
                      {aiError}
                    </div>
                  )}


                  {aiImageAnalysis && (
                    <div className="border rounded p-3 mb-3">

                      <h6 className="fw-bold">
                        Detected Issue
                      </h6>

                      <p className="mb-3">
                        {aiImageAnalysis.detectedIssue ||
                          "No clear issue detected."}
                      </p>


                      <div className="row g-3">

                        <div className="col-md-6">
                          <div className="small text-secondary">
                            AI Suggested Category
                          </div>

                          <div className="fw-semibold">
                            {
                              aiImageAnalysis.suggestedCategory ||
                              "Other"
                            }
                          </div>
                        </div>


                        <div className="col-md-6">
                          <div className="small text-secondary">
                            Evidence Confidence
                          </div>

                          <div className="fw-semibold">
                            {
                              Number(
                                aiImageAnalysis.confidence ||
                                  0
                              )
                            }
                            %
                          </div>
                        </div>

                      </div>


                      {aiImageAnalysis.observations?.length >
                        0 && (
                        <div className="mt-3">

                          <div className="small text-secondary mb-1">
                            Visible observations
                          </div>

                          <ul className="mb-0">
                            {aiImageAnalysis.observations.map(
                              (
                                observation,
                                index
                              ) => (
                                <li
                                  key={
                                    index
                                  }
                                >
                                  {
                                    observation
                                  }
                                </li>
                              )
                            )}
                          </ul>

                        </div>
                      )}

                    </div>
                  )}


                  {aiVerification && (
                    <div className="border rounded p-3">

                      <h6 className="fw-bold mb-3">
                        Report Consistency
                      </h6>


                      <div className="row g-3">

                        <div className="col-md-4">
                          <div className="small text-secondary">
                            Category Match
                          </div>

                          <span
                            className={`badge ${
                              aiVerification.categoryMatch
                                ? "text-bg-success"
                                : "text-bg-warning"
                            }`}
                          >
                            {aiVerification.categoryMatch
                              ? "Consistent"
                              : "Needs Review"}
                          </span>
                        </div>


                        <div className="col-md-4">
                          <div className="small text-secondary">
                            Description Match
                          </div>

                          <span
                            className={`badge ${
                              aiVerification.descriptionMatch
                                ? "text-bg-success"
                                : "text-bg-warning"
                            }`}
                          >
                            {aiVerification.descriptionMatch
                              ? "Consistent"
                              : "Needs Review"}
                          </span>
                        </div>


                        <div className="col-md-4">
                          <div className="small text-secondary">
                            Consistency Score
                          </div>

                          <strong>
                            {
                              Number(
                                aiVerification.score ||
                                  0
                              )
                            }
                            %
                          </strong>
                        </div>

                      </div>


                      {aiVerification.reason && (
                        <div className="mt-3">
                          <div className="small text-secondary">
                            AI Reason
                          </div>

                          <p className="mb-0">
                            {
                              aiVerification.reason
                            }
                          </p>
                        </div>
                      )}

                    </div>
                  )}


                  <div className="alert alert-info mt-3 mb-0">
                    <strong>Important:</strong>{" "}
                    AI analysis is an evidence-consistency
                    check. It does not prove that a complaint
                    is true or false.
                  </div>

                </div>
              </div>
            )}


            {/* =================================================
                SUBMIT
            ================================================= */}

            <div className="card shadow-sm border-0">
              <div className="card-body p-4">

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">

                  <div>
                    <h5 className="fw-bold mb-1">
                      Ready to report?
                    </h5>

                    <p className="text-secondary mb-0">
                      Your report will appear on the public
                      complaint map after submission.
                    </p>
                  </div>


                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={
                      submitting ||
                      uploading ||
                      aiLoading
                    }
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Report"}
                  </button>

                </div>

              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}

export default ReportSomething;