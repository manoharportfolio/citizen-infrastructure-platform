import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="home-hero">
        <div className="container">
          <div className="row align-items-center g-5">

            {/* HERO CONTENT */}
            <div className="col-lg-6">
              <div className="home-eyebrow">
                <span className="home-eyebrow-dot"></span>
                CITIZEN INFRASTRUCTURE INTELLIGENCE
              </div>

              <h1>
                See the problems
                <br />
                <span>people are reporting.</span>
              </h1>

              <p className="home-hero-description">
                citizen-infrastructure-platform turns citizen complaints into
                location-based public intelligence.
                Explore what people are reporting,
                discover complaint hotspots, and
                understand which problems are
                concentrated in your area.
              </p>

              <div className="home-hero-actions">
                <Link
                  to="/explore"
                  className="home-primary-button"
                >
                  Explore Complaints
                  <span>→</span>
                </Link>

                <Link
                  to="/citizen/report-now"
                  className="home-secondary-button"
                >
                  Report an Issue
                </Link>
              </div>

              <div className="home-trust-line">
                <span>●</span>

                <span>
                  Anyone can explore
                </span>

                <span className="home-trust-divider">
                  /
                </span>

                <span>
                  Login required only to report
                </span>
              </div>
            </div>

            {/* MAP VISUAL */}
            <div className="col-lg-6">
              <div className="home-visual">

                <div className="home-map-card">

                  <div className="home-map-header">
                    <div>
                      <span className="home-map-label">
                        COMPLAINT INTELLIGENCE
                      </span>

                      <h3>
                        Hyderabad
                      </h3>
                    </div>

                    <div className="home-map-status">
                      <span></span>
                      Active
                    </div>
                  </div>

                  {/* VISUAL MAP */}
                  <div className="home-map">
                    <div className="map-grid"></div>

                    <div className="map-road road-one"></div>
                    <div className="map-road road-two"></div>
                    <div className="map-road road-three"></div>

                    <div className="map-zone zone-one"></div>
                    <div className="map-zone zone-two"></div>

                    <div className="map-point point-one">
                      <span></span>
                    </div>

                    <div className="map-point point-two">
                      <span></span>
                    </div>

                    <div className="map-point point-three">
                      <span></span>
                    </div>

                    <div className="map-point point-four">
                      <span></span>
                    </div>

                    <div className="map-point point-five">
                      <span></span>
                    </div>

                    <div className="map-hotspot hotspot-one">
                      <span></span>
                      <strong>48</strong>
                    </div>

                    <div className="map-hotspot hotspot-two">
                      <span></span>
                      <strong>31</strong>
                    </div>
                  </div>

                  {/* SAMPLE VISUAL STATS */}
                  <div className="home-map-footer">

                    <div>
                      <span className="map-stat-number">
                        248
                      </span>

                      <span className="map-stat-label">
                        reports
                      </span>
                    </div>

                    <div>
                      <span className="map-stat-number">
                        12
                      </span>

                      <span className="map-stat-label">
                        hotspots
                      </span>
                    </div>

                    <div>
                      <span className="map-stat-number">
                        8
                      </span>

                      <span className="map-stat-label">
                        categories
                      </span>
                    </div>

                  </div>

                </div>

                {/* IMPORTANT:
                    These numbers are currently visual
                    placeholders. They will later be
                    connected to Firestore. */}

                <p className="small text-muted mt-2 mb-0">
                  Example visualization — live statistics
                  will come from citizen reports.
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}
      <section className="home-process">
        <div className="container">

          <div className="home-section-heading">
            <span>
              HOW IT WORKS
            </span>

            <h2>
              From one complaint
              <br />
              to a bigger picture.
            </h2>
          </div>

          <div className="row g-4">

            {/* STEP 1 */}
            <div className="col-md-6 col-lg-3">
              <div className="home-process-card h-100">

                <div className="process-number">
                  01
                </div>

                <div className="process-icon">
                  +
                </div>

                <h3>
                  People report
                </h3>

                <p>
                  Citizens submit infrastructure
                  complaints with location,
                  description and evidence.
                </p>

              </div>
            </div>


            {/* STEP 2 */}
            <div className="col-md-6 col-lg-3">
              <div className="home-process-card h-100">

                <div className="process-number">
                  02
                </div>

                <div className="process-icon">
                  ◈
                </div>

                <h3>
                  AI checks the evidence
                </h3>

                <p>
                  Gemini analyzes submitted evidence
                  and checks whether it is consistent
                  with the reported problem.
                </p>

              </div>
            </div>


            {/* STEP 3 */}
            <div className="col-md-6 col-lg-3">
              <div className="home-process-card h-100">

                <div className="process-number">
                  03
                </div>

                <div className="process-icon">
                  ◎
                </div>

                <h3>
                  Problems become visible
                </h3>

                <p>
                  Similar complaints are grouped
                  by location so people can see
                  where problems are concentrated.
                </p>

              </div>
            </div>


            {/* STEP 4 */}
            <div className="col-md-6 col-lg-3">
              <div className="home-process-card h-100">

                <div className="process-number">
                  04
                </div>

                <div className="process-icon">
                  ↗
                </div>

                <h3>
                  Explore the bigger picture
                </h3>

                <p>
                  Area intelligence reveals
                  complaint density, categories,
                  trends and hotspots.
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="home-final-cta">
        <div className="container">

          <div className="text-center">

            <span className="home-cta-label">
              HAVE YOU SEEN A PROBLEM?
            </span>

            <h2>
              Your report adds
              <br />
              to the bigger picture.
            </h2>

            <p>
              Help make local infrastructure
              problems visible.
            </p>

            <Link
              to="/citizen/report-now"
              className="home-primary-button"
            >
              Report an Issue
              <span>→</span>
            </Link>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;