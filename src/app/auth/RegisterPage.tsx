// src/app/auth/RegisterPage.tsx

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      email.trim().length >= 3 &&
      password.length >= 6
    );
  }, [firstName, lastName, email, password]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const fn = firstName.trim();
    const ln = lastName.trim();

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: fn,
          last_name: ln,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    // If email confirmation is enabled, user must confirm then login.
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl text-white font-semibold">Create Account</h1>
        <div className="text-sm text-white/60 mt-1">
          Set up your private manager dashboard.
        </div>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First Name"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />

            <input
              required
              placeholder="Last Name"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>

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
            placeholder="Password (min 6 characters)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {errorMsg && <div className="text-red-400 text-sm">{errorMsg}</div>}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white py-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="underline text-white">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
