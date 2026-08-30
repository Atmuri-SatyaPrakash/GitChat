import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/api";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkLogin() {
      try {
        const user = await getCurrentUser();

        if (user) {
          navigate("/", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate("/", { replace: true });
      }
    }

    checkLogin();
  }, [navigate]);

  return (
    <div className="auth-callback">
      <h2>Signing you in...</h2>
      <p>Please wait while we connect your GitHub account.</p>
    </div>
  );
}

export default AuthCallback;