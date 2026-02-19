import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error retrieving session:", error);
        navigate("/login");
      } else if (data.session) {
        console.log("Logged in:", data.session.user);
        navigate("/dashboard"); // ✅ send them to dashboard
      } else {
        navigate("/login");
      }
    };

    handleSession();
  }, [navigate]);

  return <p>Finishing login...</p>;
}
