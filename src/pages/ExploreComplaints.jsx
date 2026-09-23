import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { getPublicReports } from "../services/publicReportService";

/*
  Fix the default Leaflet marker icons when using Vite.
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

const HYDERABAD_CENTER = [
  17.385,
  78.4867
];

/*
  Changes the Leaflet map center when
  the selected reports change.
*/
function MapCenterController({ reports }) {
  const map = useMap();

  useEffect(() => {
    const validReport = reports.find(
      (report) =>
        typeof report.location?.latitude ===
          "number" &&
        typeof report.location?.longitude ===
          "number"
    );

    if (validReport) {
      map.setView(
        [
          validReport.location.latitude,
          validReport.location.longitude
        ],
        12
      );
    }
  }, [reports, map]);

  return null;
}

function ExploreComplaints() {
  const [reports, setReports] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [area, setArea] =
    useState("");

  /*
    Load all public complaints.
    No authentication is required.
  */
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPublicReports();

        setReports(
          data.reports || []
        );
      } catch (err) {
        console.error(
          "Explore complaints error:",
          err
        );

        setError(
          err.message ||
            "Unable to load complaints."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  /*
    Get available categories.
  */
  const categories = useMemo(() => {
    return [
      ...new Set(
        reports
          .map(
            (report) =>
              report.category
          )
          .filter(Boolean)
      )
    ].sort();
  }, [reports]);

  /*
    Get available areas.
  */
  const areas = useMemo(() => {
    return [
      ...new Set(
        reports
          .map(
            (report) =>
              report.location?.area
          )
          .filter(Boolean)
      )
    ].sort();
  }, [reports]);

  /*
    Filter reports based on:
    - search
    - category
    - area
  */
  const filteredReports = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return reports.filter(
      (report) => {
        const description =
          report.description
            ?.toLowerCase() || "";

        const reportCategory =
          report.category
            ?.toLowerCase() || "";

        const reportArea =
          report.location?.area
            ?.toLowerCase() || "";

        const reportCity =
          report.location?.city
            ?.toLowerCase() || "";

        const matchesSearch =
          !searchValue ||
          description.includes(
            searchValue
          ) ||
          reportCategory.includes(
            searchValue
          ) ||
          reportArea.includes(
            searchValue
          ) ||
          reportCity.includes(
            searchValue
          );

        const matchesCategory =
          !category ||
          report.category === category;

        const matchesArea =
          !area ||
          report.location?.area === area;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesArea
        );
      }
    );
  }, [
    reports,
    search,
    category,
    area
  ]);

  /*
    Reports that actually contain GPS
    coordinates.
  */
  const mappedReports =
    filteredReports.filter(
      (report) =>
        typeof report.location
          ?.latitude === "number" &&
        typeof report.location
          ?.longitude === "number"
    );

  /*
    Group reports by area to create
    a simple public hotspot view.
  */
  const hotspots = useMemo(() => {
    const groups = {};

    filteredReports.forEach(
      (report) => {
        const reportArea =
          report.location?.area ||
          "Unknown area";

        if (!groups[reportArea]) {
          groups[reportArea] = {
            area: reportArea,
            count: 0,
            latitude: null,
            longitude: null,
            reports: []
          };
        }

        groups[reportArea].count += 1;

        groups[reportArea].reports.push(
          report
        );

        if (
          groups[reportArea].latitude ===
            null &&
          typeof report.location
            ?.latitude === "number" &&
          typeof report.location
            ?.longitude === "number"
        ) {
          groups[reportArea].latitude =
            report.location.latitude;

          groups[reportArea].longitude =
            report.location.longitude;
        }
      }
    );

    return Object.values(groups)
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 10);
  }, [filteredReports]);

  /*
    Category count.
  */
  const categoryCount =
    new Set(
      filteredReports
        .map(
          (report) =>
            report.category
        )
        .filter(Boolean)
    ).size;

  /*
    Number of distinct areas.
  */
  const areaCount =
    new Set(
      filteredReports
        .map(
          (report) =>
            report.location?.area
        )
        .filter(Boolean)
    ).size;

  /*
    Clear all filters.
  */
  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setArea("");
  };

  return (
    <div className="bg-light min-vh-100">

      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <section className="bg-white border-bottom">
        <div className="container py-5">

          <div className="row align-items-end g-4">

            <div className="col-lg-8">
              <span className="badge text-bg-primary mb-3">
                PUBLIC COMPLAINT INTELLIGENCE
              </span>

              <h1 className="display-5 fw-bold mb-3">
                Explore Complaints
              </h1>

              <p className="lead text-secondary mb-0">
                See infrastructure problems reported
                by citizens, discover complaint
                hotspots, and explore what is being
                reported in different areas.
              </p>
            </div>

            <div className="col-lg-4 text-lg-end">
              <Link
                to="/citizen/report-now"
                className="btn btn-primary btn-lg"
              >
                Report an Issue →
              </Link>
            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}
      <div className="container py-5">

        {/* ERROR */}
        {error && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            <strong>
              Unable to load complaints.
            </strong>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}


        {/* =================================================
            STATISTICS
        ================================================= */}
        <div className="row g-3 mb-4">

          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-secondary">
                  TOTAL REPORTS
                </small>

                <div className="fs-2 fw-bold mt-2">
                  {loading
                    ? "—"
                    : reports.length}
                </div>

                <small className="text-secondary">
                  Public citizen reports
                </small>
              </div>
            </div>
          </div>


          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-secondary">
                  AREAS
                </small>

                <div className="fs-2 fw-bold mt-2">
                  {loading
                    ? "—"
                    : areaCount}
                </div>

                <small className="text-secondary">
                  Areas with reports
                </small>
              </div>
            </div>
          </div>


          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-secondary">
                  CATEGORIES
                </small>

                <div className="fs-2 fw-bold mt-2">
                  {loading
                    ? "—"
                    : categoryCount}
                </div>

                <small className="text-secondary">
                  Reported problem types
                </small>
              </div>
            </div>
          </div>


          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <small className="text-secondary">
                  CURRENT VIEW
                </small>

                <div className="fs-2 fw-bold mt-2">
                  {loading
                    ? "—"
                    : filteredReports.length}
                </div>

                <small className="text-secondary">
                  Reports after filters
                </small>
              </div>
            </div>
          </div>

        </div>


        {/* =================================================
            FILTERS
        ================================================= */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">

            <div className="row g-3">

              {/* SEARCH */}
              <div className="col-lg-5">
                <label
                  htmlFor="complaint-search"
                  className="form-label fw-semibold"
                >
                  Search complaints
                </label>

                <input
                  id="complaint-search"
                  type="search"
                  className="form-control"
                  placeholder="Search by problem, category, area..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>


              {/* CATEGORY */}
              <div className="col-md-6 col-lg-3">
                <label
                  htmlFor="category-filter"
                  className="form-label fw-semibold"
                >
                  Category
                </label>

                <select
                  id="category-filter"
                  className="form-select"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All categories
                  </option>

                  {categories.map(
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


              {/* AREA */}
              <div className="col-md-6 col-lg-3">
                <label
                  htmlFor="area-filter"
                  className="form-label fw-semibold"
                >
                  Area
                </label>

                <select
                  id="area-filter"
                  className="form-select"
                  value={area}
                  onChange={(event) =>
                    setArea(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All areas
                  </option>

                  {areas.map(
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


              {/* CLEAR */}
              <div className="col-lg-1 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={clearFilters}
                  title="Clear filters"
                >
                  ×
                </button>
              </div>

            </div>

          </div>
        </div>


        {/* =================================================
            MAP + HOTSPOTS
        ================================================= */}
        <div className="row g-4 mb-5">

          {/* MAP */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm overflow-hidden">

              <div className="card-header bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">

                  <div>
                    <h5 className="mb-1">
                      Complaint Map
                    </h5>

                    <small className="text-secondary">
                      {mappedReports.length} mapped
                      complaints
                    </small>
                  </div>

                  <span className="badge text-bg-light">
                    Public view
                  </span>

                </div>
              </div>

              <div>
                {loading ? (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{
                      minHeight: "450px"
                    }}
                  >
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    ></div>

                    <p className="text-secondary mt-3 mb-0">
                      Loading complaint map...
                    </p>
                  </div>
                ) : (
                  <MapContainer
                    center={
                      HYDERABAD_CENTER
                    }
                    zoom={11}
                    scrollWheelZoom={true}
                    style={{
                      height: "500px",
                      width: "100%"
                    }}
                  >

                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapCenterController
                      reports={
                        mappedReports
                      }
                    />

                    {/* INDIVIDUAL REPORT MARKERS */}
                    {mappedReports.map(
                      (report) => (
                        <Marker
                          key={report.id}
                          position={[
                            report.location
                              .latitude,
                            report.location
                              .longitude
                          ]}
                        >
                          <Popup>
                            <div
                              style={{
                                minWidth:
                                  "190px"
                              }}
                            >
                              <strong>
                                {report.category ||
                                  "Infrastructure Issue"}
                              </strong>

                              <p className="small mt-2 mb-2">
                                {report.description ||
                                  "Citizen complaint"}
                              </p>

                              <p className="small text-secondary mb-2">
                                {report.location
                                  ?.area ||
                                  "Unknown area"}
                              </p>

                              <Link
                                to={`/complaint/${report.id}`}
                                className="btn btn-sm btn-primary"
                              >
                                View Complaint
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    )}

                    {/* AREA HOTSPOT CIRCLES */}
                    {hotspots
                      .filter(
                        (hotspot) =>
                          typeof hotspot.latitude ===
                            "number" &&
                          typeof hotspot.longitude ===
                            "number"
                      )
                      .map(
                        (hotspot) => (
                          <Circle
                            key={`hotspot-${hotspot.area}`}
                            center={[
                              hotspot.latitude,
                              hotspot.longitude
                            ]}
                            radius={
                              Math.min(
                                700 +
                                  hotspot.count *
                                    60,
                                2200
                              )
                            }
                            pathOptions={{
                              fillOpacity:
                                0.12,
                              weight: 1
                            }}
                          />
                        )
                      )}

                  </MapContainer>
                )}
              </div>

            </div>
          </div>


          {/* HOTSPOTS */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">

              <div className="card-header bg-white py-3">
                <h5 className="mb-1">
                  Complaint Hotspots
                </h5>

                <small className="text-secondary">
                  Areas with the most reports
                </small>
              </div>

              <div className="card-body">

                {loading ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    ></div>
                  </div>
                ) : hotspots.length ===
                  0 ? (
                  <div className="text-center py-5">
                    <h6>
                      No hotspots found
                    </h6>

                    <p className="small text-secondary mb-0">
                      Complaint concentration
                      will appear here as reports
                      are submitted.
                    </p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">

                    {hotspots.map(
                      (hotspot, index) => (
                        <Link
                          key={hotspot.area}
                          to={`/area/${encodeURIComponent(
                            hotspot.area
                          )}`}
                          className="list-group-item list-group-item-action px-0"
                        >
                          <div className="d-flex justify-content-between align-items-center">

                            <div className="d-flex align-items-center gap-3">

                              <span
                                className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold"
                                style={{
                                  width:
                                    "34px",
                                  height:
                                    "34px"
                                }}
                              >
                                {index + 1}
                              </span>

                              <div>
                                <div className="fw-semibold">
                                  {
                                    hotspot.area
                                  }
                                </div>

                                <small className="text-secondary">
                                  Complaint hotspot
                                </small>
                              </div>

                            </div>

                            <span className="badge text-bg-primary">
                              {
                                hotspot.count
                              }
                            </span>

                          </div>
                        </Link>
                      )
                    )}

                  </div>
                )}

              </div>
            </div>
          </div>

        </div>


        {/* =================================================
            RECENT COMPLAINTS
        ================================================= */}
        <section>

          <div className="d-flex justify-content-between align-items-center mb-4">

            <div>
              <h3 className="mb-1">
                Recent Complaints
              </h3>

              <p className="text-secondary mb-0">
                Latest public reports from citizens.
              </p>
            </div>

            {filteredReports.length > 0 && (
              <span className="text-secondary small">
                Showing{" "}
                {filteredReports.length}{" "}
                reports
              </span>
            )}

          </div>


          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary"
                role="status"
              ></div>

              <p className="text-secondary mt-3">
                Loading complaints...
              </p>
            </div>
          ) : filteredReports.length ===
            0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">

                <h5>
                  No complaints found
                </h5>

                <p className="text-secondary">
                  Try changing your search or
                  filters.
                </p>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>

              </div>
            </div>
          ) : (
            <div className="row g-4">

              {filteredReports
                .slice(0, 12)
                .map((report) => (
                  <div
                    className="col-md-6 col-lg-4"
                    key={report.id}
                  >
                    <div className="card border-0 shadow-sm h-100">

                      {report.evidence
                        ?.imageUrl && (
                        <img
                          src={
                            report.evidence
                              .imageUrl
                          }
                          alt={
                            report.category ||
                            "Complaint evidence"
                          }
                          className="card-img-top"
                          style={{
                            height:
                              "200px",
                            objectFit:
                              "cover"
                          }}
                        />
                      )}

                      <div className="card-body d-flex flex-column">

                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">

                          <span className="badge text-bg-primary">
                            {report.category ||
                              "Infrastructure Issue"}
                          </span>

                          {report.aiAnalysis
                            ?.checked && (
                            <span className="badge text-bg-success">
                              AI analyzed
                            </span>
                          )}

                        </div>

                        <h5 className="card-title">
                          {report.description ||
                            "Citizen complaint"}
                        </h5>

                        <p className="text-secondary small mb-2">
                          {report.location
                            ?.area ||
                            "Unknown area"}

                          {report.location
                            ?.city
                            ? `, ${report.location.city}`
                            : ""}
                        </p>

                        {report.aiAnalysis
                          ?.confidence !==
                          undefined && (
                          <p className="small text-secondary">
                            Evidence confidence:{" "}
                            <strong>
                              {Math.round(
                                report
                                  .aiAnalysis
                                  .confidence *
                                  100
                              )}
                              %
                            </strong>
                          </p>
                        )}

                        <div className="mt-auto pt-3">

                          <Link
                            to={`/complaint/${report.id}`}
                            className="btn btn-outline-primary btn-sm"
                          >
                            View Complaint
                          </Link>

                        </div>

                      </div>
                    </div>
                  </div>
                ))}

            </div>
          )}

        </section>


        {/* =================================================
            REPORT CTA
        ================================================= */}
        <div className="card border-0 bg-primary text-white mt-5">
          <div className="card-body p-4 p-lg-5">

            <div className="row align-items-center g-4">

              <div className="col-lg-8">
                <h3 className="fw-bold">
                  Seen an infrastructure problem?
                </h3>

                <p className="mb-0 opacity-75">
                  Your report can add another piece
                  to the bigger picture of what is
                  happening in your area.
                </p>
              </div>

              <div className="col-lg-4 text-lg-end">
                <Link
                  to="/citizen/report-now"
                  className="btn btn-light btn-lg"
                >
                  Report an Issue →
                </Link>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ExploreComplaints;