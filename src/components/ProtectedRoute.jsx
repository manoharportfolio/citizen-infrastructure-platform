import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setCheckingAuth(false);
        }
      );

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>

        <p>
          Checking your account...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/citizen/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;