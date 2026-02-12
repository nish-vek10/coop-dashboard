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
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* ✅ Hero heading */}
      <div className="text-center mb-8">
        <div className="text-2xl md:text-3xl font-extrabold tracking-[0.18em] text-white/80">
          WELCOME TO
        </div>

        <div className="mt-2 text-4xl md:text-5xl font-extrabold tracking-wide text-white drop-shadow-[0_0_22px_rgba(251,191,36,0.18)]">
          WEEKLY ROTA FORMATION
        </div>

        <div className="mt-3 text-base md:text-lg text-white/60">
          Secure Manager Access to your Private Rota Dashboard.
        </div>

        {/* subtle underline glow */}
        <div className="mx-auto mt-5 h-[2px] w-40 rounded-full bg-amber-300/30 shadow-[0_0_24px_rgba(251,191,36,0.20)]" />
      </div>

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl text-white font-semibold">Sign In</h1>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}

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
