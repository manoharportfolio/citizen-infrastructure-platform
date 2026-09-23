import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProfile from "./pages/CitizenProfile";

// Public pages
import Home from "./pages/Home";
import ExploreComplaints from "./pages/ExploreComplaints";
import ComplaintDetails from "./pages/ComplaintDetails";
import AreaIntelligence from "./pages/AreaIntelligence";

// Citizen authentication
import CitizenLogin from "./pages/CitizenLogin";
import CitizenRegister from "./pages/CitizenRegister";

// Protected citizen pages
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportNow from "./pages/ReportNow";
import ReportSomething from "./pages/ReportSomething";
import MyReports from "./pages/MyReports";

function App() {
  return (
    <div className="app-wrapper">

      {/* NAVBAR */}
      <Navbar />

      <main className="main-content">
        <Routes>

          {/* =========================================
              PUBLIC PAGES
          ========================================= */}

          {/* Home */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* Explore all public complaints */}
          <Route
            path="/explore"
            element={<ExploreComplaints />}
          />

          <Route
  path="/citizen/profile"
  element={
    <ProtectedRoute>
      <CitizenProfile />
    </ProtectedRoute>
  }
/>

          {/* Area-specific complaint intelligence */}
          <Route
            path="/area/:areaName"
            element={<AreaIntelligence />}
          />

          {/* Individual public complaint */}
          <Route
            path="/complaint/:id"
            element={<ComplaintDetails />}
          />


          {/* =========================================
              CITIZEN AUTHENTICATION
          ========================================= */}

          {/* Login */}
          <Route
            path="/citizen/login"
            element={<CitizenLogin />}
          />

          {/* Register */}
          <Route
            path="/citizen/register"
            element={<CitizenRegister />}
          />


          {/* =========================================
              PROTECTED CITIZEN PAGES
          ========================================= */}

          {/* Citizen dashboard */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          {/* Report a problem happening now */}
          <Route
            path="/citizen/report-now"
            element={
              <ProtectedRoute>
                <ReportNow />
              </ProtectedRoute>
            }
          />

          {/* Report something the citizen saw earlier */}
          <Route
            path="/citizen/report-something"
            element={
              <ProtectedRoute>
                <ReportSomething />
              </ProtectedRoute>
            }
          />

          {/* Citizen's own reports */}
          <Route
            path="/citizen/my-reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              FALLBACK
          ========================================= */}

          {/* Any unknown URL goes back to Home */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </main>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}

export default App;