import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navbarRef = useRef(null);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ==========================================
  // AUTH
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          return;
        }

        try {
          const profileRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const snapshot = await getDoc(
            profileRef
          );

          if (snapshot.exists()) {
            setProfile(snapshot.data());
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error(
            "Unable to load profile:",
            error
          );

          setProfile(null);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // CLOSE MENUS WHEN ROUTE CHANGES
  // ==========================================

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // ==========================================
  // CLICK OUTSIDE
  // ==========================================

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(
          event.target
        )
      ) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ==========================================
  // HAMBURGER
  // ==========================================

  function toggleMenu() {
    setMenuOpen((previous) => !previous);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  // ==========================================
  // PROFILE
  // ==========================================

  function toggleProfile() {
    setProfileOpen((previous) => !previous);
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    try {
      await signOut(auth);

      setUser(null);
      setProfile(null);

      setProfileOpen(false);
      setMenuOpen(false);

      navigate("/");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  // ==========================================
  // PROFILE DATA
  // ==========================================

  const profileName =
    profile?.fullName || "Citizen";

  const profileInitial =
    profileName
      .charAt(0)
      .toUpperCase();

  return (
    <nav
      ref={navbarRef}
      className="navbar navbar-expand-lg civic-navbar"
    >
      <div className="container">

        {/* =====================================
            LOGO
        ===================================== */}

        <Link
          to="/"
          className="navbar-brand civic-navbar-brand"
          onClick={closeMenu}
        >
          CivicAI
        </Link>

        {/* =====================================
            RIGHT SIDE
            PROFILE + HAMBURGER
        ===================================== */}

        <div className="d-flex align-items-center">

          {/* ===================================
              PROFILE
              OUTSIDE HAMBURGER
          =================================== */}

          {user && (
            <div className="profile-wrapper">

              <button
                type="button"
                className="profile-button"
                onClick={toggleProfile}
                aria-label="Open profile"
                aria-expanded={profileOpen}
              >
                <span className="profile-avatar">
                  {profileInitial}
                </span>
              </button>

              {/* =================================
                  FLOATING PROFILE POPUP
              ================================= */}

              {profileOpen && (
                <div className="profile-popup">

                  <div className="profile-popup-header">

                    <div className="profile-popup-name">
                      {profileName}
                    </div>

                    <div className="profile-popup-email">
                      {profile?.email ||
                        user.email ||
                        ""}
                    </div>

                  </div>

                  <button
                    type="button"
                    className="profile-popup-item"
                    onClick={() => {
                      setProfileOpen(false);
                      setMenuOpen(false);

                      navigate(
                        "/citizen/profile"
                      );
                    }}
                  >
                    <span>👤</span>
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    className="profile-popup-item"
                    onClick={() => {
                      setProfileOpen(false);
                      setMenuOpen(false);

                      navigate(
                        "/citizen/my-reports"
                      );
                    }}
                  >
                    <span>📋</span>
                    <span>My Reports</span>
                  </button>

                  <div className="profile-popup-divider"></div>

                  <button
                    type="button"
                    className="profile-popup-item logout-item"
                    onClick={handleLogout}
                  >
                    <span>↪</span>
                    <span>Logout</span>
                  </button>

                </div>
              )}
            </div>
          )}

          {/* ===================================
              HAMBURGER
          =================================== */}

          <button
            type="button"
            className="navbar-toggler ms-2"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

        </div>

        {/* =====================================
            HAMBURGER MENU
            PROFILE IS NOT INSIDE THIS
        ===================================== */}

        <div
          className={`collapse navbar-collapse ${
            menuOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav ms-auto align-items-lg-center">

            {/* HOME */}

            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link ${
                  location.pathname === "/"
                    ? "active"
                    : ""
                }`}
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>

            {/* EXPLORE */}

            <li className="nav-item">
              <Link
                to="/explore"
                className={`nav-link ${
                  location.pathname ===
                  "/explore"
                    ? "active"
                    : ""
                }`}
                onClick={closeMenu}
              >
                Explore Complaints
              </Link>
            </li>

            {/* REPORT */}

            <li className="nav-item">
              <Link
                to={
                  user
                    ? "/citizen/report-now"
                    : "/citizen/login"
                }
                className={`nav-link ${
                  location.pathname.startsWith(
                    "/citizen/report"
                  )
                    ? "active"
                    : ""
                }`}
                onClick={closeMenu}
              >
                Report an Issue
              </Link>
            </li>

            {/* LOGGED IN LINKS */}

            {user && (
              <>
                <li className="nav-item">
                  <Link
                    to="/citizen/dashboard"
                    className="nav-link"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/citizen/my-reports"
                    className="nav-link"
                    onClick={closeMenu}
                  >
                    My Reports
                  </Link>
                </li>
              </>
            )}

            {/* LOGIN */}

            {!user && (
              <li className="nav-item">
                <Link
                  to="/citizen/login"
                  className="btn btn-primary ms-lg-2 mt-2 mt-lg-0"
                  onClick={closeMenu}
                >
                  Login
                </Link>
              </li>
            )}

          </ul>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;