import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-dark text-light mt-auto">
      <div className="container py-5">
        <div className="row g-4">

          {/* BRAND */}
          <div className="col-lg-5">
            <Link
              to="/"
              className="text-decoration-none text-light d-inline-flex align-items-center gap-2 mb-3"
            >
              <span
                className="d-flex align-items-center justify-content-center bg-primary rounded-3 fw-bold"
                style={{
                  width: "38px",
                  height: "38px"
                }}
              >
                C
              </span>

              <span className="fs-4 fw-bold">
                Civic<span className="text-primary">AI</span>
              </span>
            </Link>

            <p className="text-secondary mb-0">
              AI-powered citizen infrastructure
              intelligence. Report problems, verify
              evidence, and understand where
              complaints are concentrated.
            </p>
          </div>

          {/* EXPLORE */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold mb-3">
              Explore
            </h6>

            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link
                  to="/"
                  className="text-secondary text-decoration-none"
                >
                  Home
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/explore"
                  className="text-secondary text-decoration-none"
                >
                  Complaints
                </Link>
              </li>
            </ul>
          </div>

          {/* CITIZENS */}
          <div className="col-6 col-lg-2">
            <h6 className="fw-bold mb-3">
              Citizens
            </h6>

            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link
                  to="/citizen/report-now"
                  className="text-secondary text-decoration-none"
                >
                  Report Now
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/citizen/report-something"
                  className="text-secondary text-decoration-none"
                >
                  Report Something
                </Link>
              </li>

              <li className="mb-2">
                <Link
                  to="/citizen/login"
                  className="text-secondary text-decoration-none"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* ABOUT */}
          <div className="col-lg-3">
            <h6 className="fw-bold mb-3">
              citizen-infrastructure-platform
            </h6>

            <p className="text-secondary small mb-0">
              A public platform where citizens
              can explore infrastructure complaints
              and contribute reports with evidence.
            </p>
          </div>

        </div>

        <hr className="border-secondary my-4" />

        {/* BOTTOM */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">

          <small className="text-secondary">
            © {new Date().getFullYear()} citizen-infrastructure-platform.
            All rights reserved.
          </small>

          <small className="text-secondary">
            Report. Verify. Prioritize. Act.
          </small>

        </div>
      </div>
    </footer>
  );
}

export default Footer;