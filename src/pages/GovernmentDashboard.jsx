import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../firebase/config";

function GovernmentDashboard() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate("/government/login");
  }

  return (
    <div className="container py-5">

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h2 className="fw-bold">
            Government Dashboard
          </h2>

          <p className="text-muted mb-0">
            Infrastructure intelligence overview.
          </p>
        </div>

        <button
          className="btn btn-outline-danger"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      <div className="row g-4">

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Reports
              </p>

              <h2>0</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <p className="text-muted mb-1">
                High Priority
              </p>

              <h2>0</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <p className="text-muted mb-1">
                Under Verification
              </p>

              <h2>0</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <p className="text-muted mb-1">
                Resolved
              </p>

              <h2>0</h2>
            </div>
          </div>
        </div>

      </div>

      <div className="card mt-4">

        <div className="card-body">

          <h5>
            Infrastructure Hotspots
          </h5>

          <div className="border rounded p-5 text-center text-muted mt-3">
            Hotspot map will be added in a later phase.
          </div>

        </div>

      </div>

    </div>
  );
}

export default GovernmentDashboard;