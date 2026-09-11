import { Link } from "react-router-dom";

function RoleSelection() {
  return (
    <div className="container py-5">

      <div className="text-center mb-5">
        <h2 className="fw-bold">
          Who are you?
        </h2>

        <p className="text-muted">
          Select your role to continue.
        </p>
      </div>

      <div className="row justify-content-center g-4">

        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-body p-4 text-center">

              <i className="bi bi-person fs-1"></i>

              <h4 className="mt-3">
                Citizen
              </h4>

              <p className="text-muted">
                Report infrastructure problems
                and track your complaints.
              </p>

              <Link
                to="/citizen/login"
                className="btn btn-dark w-100"
              >
                Continue as Citizen
              </Link>

            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-body p-4 text-center">

              <i className="bi bi-building fs-1"></i>

              <h4 className="mt-3">
                Government Officer
              </h4>

              <p className="text-muted">
                Review infrastructure intelligence
                and manage reported issues.
              </p>

              <Link
                to="/government/login"
                className="btn btn-outline-dark w-100"
              >
                Continue as Officer
              </Link>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default RoleSelection;