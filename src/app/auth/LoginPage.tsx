// src/app/auth/LoginPage.tsx

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl text-white font-semibold">Sign In</h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <div className="text-red-400 text-sm">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white py-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-sm text-white/60">
            Don’t have an account?{" "}
            <Link to="/register" className="underline text-white">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
