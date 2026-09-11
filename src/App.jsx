import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import RoleSelection from "./pages/RoleSelection";

import CitizenRegister from "./pages/CitizenRegister";
import CitizenLogin from "./pages/CitizenLogin";
import CitizenDashboard from "./pages/CitizenDashboard";

import GovernmentRegister from "./pages/GovernmentRegister";
import GovernmentLogin from "./pages/GovernmentLogin";
import GovernmentDashboard from "./pages/GovernmentDashboard";

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/select-role"
            element={<RoleSelection />}
          />

          <Route
            path="/citizen/register"
            element={<CitizenRegister />}
          />

          <Route
            path="/citizen/login"
            element={<CitizenLogin />}
          />

          <Route
            path="/citizen/dashboard"
            element={<CitizenDashboard />}
          />

          <Route
            path="/government/register"
            element={<GovernmentRegister />}
          />

          <Route
            path="/government/login"
            element={<GovernmentLogin />}
          />

          <Route
            path="/government/dashboard"
            element={<GovernmentDashboard />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;