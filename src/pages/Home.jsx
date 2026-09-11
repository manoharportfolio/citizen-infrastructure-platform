import { Link } from "react-router-dom";

function Home() {
  return (
    <div>

      <section className="hero-section py-5">
        <div className="container py-5">

          <div className="row align-items-center">

            <div className="col-lg-7">

              <span className="badge text-bg-light border mb-3">
                AI-Powered Citizen Infrastructure Intelligence
              </span>

              <h1 className="display-5 fw-bold mb-3">
                Turn citizen reports into
                <span className="d-block">
                  actionable infrastructure intelligence.
                </span>
              </h1>

              <p className="lead text-muted mb-4">
                Report infrastructure problems, provide evidence,
                and help authorities identify high-priority issues
                across communities.
              </p>

              <Link
                to="/select-role"
                className="btn btn-dark btn-lg"
              >
                Get Started
              </Link>

            </div>

          </div>

        </div>
      </section>

      <section className="py-5">
        <div className="container">

          <div className="row g-4">

            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <i className="bi bi-megaphone fs-2"></i>
                  <h5 className="mt-3">
                    Report
                  </h5>
                  <p className="text-muted">
                    Citizens can report infrastructure
                    problems using text, voice, or evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <i className="bi bi-shield-check fs-2"></i>
                  <h5 className="mt-3">
                    Verify
                  </h5>
                  <p className="text-muted">
                    AI and supporting evidence help estimate
                    the confidence of reported issues.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border">
                <div className="card-body">
                  <i className="bi bi-bar-chart fs-2"></i>
                  <h5 className="mt-3">
                    Prioritize
                  </h5>
                  <p className="text-muted">
                    Authorities receive data-driven priority
                    insights for infrastructure problems.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default Home;