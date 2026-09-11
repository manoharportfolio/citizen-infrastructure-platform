import { Link } from "react-router-dom";

function GovernmentRegister() {
  return (
    <div className="container py-5">

      <div className="row justify-content-center">

        <div className="col-md-7">

          <div className="card shadow-sm">

            <div className="card-body p-4">

              <h2 className="fw-bold">
                Government Access
              </h2>

              <p className="text-muted">
                Government officer accounts require
                authorization from the relevant department.
              </p>

              <div className="alert alert-warning">
                For the hackathon prototype, government
                accounts will be pre-approved.
              </div>

              <p>
                Please use the approved officer credentials
                provided for the demonstration.
              </p>

              <Link
                to="/government/login"
                className="btn btn-dark"
              >
                Go to Officer Login
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default GovernmentRegister;