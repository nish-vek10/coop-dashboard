// src/app/auth/AuthProvider.tsx

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase/client";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  displayName: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getUpperFirstName(user: User | null): string {
  const meta: any = (user?.user_metadata ?? {}) as any;
  const fn = String(meta.first_name ?? "").trim();
  if (fn) return fn.toUpperCase();

  const email = String(user?.email ?? "");
  const prefix = email.includes("@") ? email.split("@")[0] : email;
  return prefix ? prefix.toUpperCase() : "";
}

function InactivityModal({
  open,
  secondsLeft,
  onStay,
  onLogout,
  onDismissOverlay,
}: {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLogout: () => void;
  onDismissOverlay: () => void;
}) {
  if (!open) return null;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onDismissOverlay} />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1224]/90 backdrop-blur-2xl shadow-2xl shadow-black/70 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/0 opacity-35" />

        <div className="relative px-6 py-5 border-b border-white/10">
          <div className="text-lg font-extrabold text-slate-100">Are you still here?</div>
          <div className="mt-1 text-sm text-slate-300/80">
            You will be automatically logged out when the countdown finishes.
          </div>
        </div>

        <div className="relative px-6 py-6 flex flex-col items-center justify-center">
          <div className="text-6xl font-extrabold tracking-wider text-slate-100 drop-shadow-[0_0_18px_rgba(255,255,255,0.12)]">
            {mm}:{ss}
          </div>
          <div className="mt-2 text-xs text-slate-300/70">
            Click Return to continue, or Log Out to end your session.
          </div>
        </div>

        <div className="relative px-6 py-5 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onStay}
            className={[
              "px-4 py-2 rounded-lg text-sm font-bold",
              "border border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
              "hover:bg-emerald-400/15 shadow-[0_0_18px_rgba(16,185,129,0.12)]",
              "backdrop-blur-xl transition-colors",
            ].join(" ")}
          >
            Return
          </button>

          <button
            onClick={onLogout}
            className={[
              "px-4 py-2 rounded-lg text-sm font-bold",
              "border border-red-400/35 bg-red-500/10 text-red-200",
              "hover:bg-red-500/15 shadow-[0_0_18px_rgba(239,68,68,0.12)]",
              "backdrop-blur-xl transition-colors",
            ].join(" ")}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  // ✅ Your desired settings
  const IDLE_MS = 1 * 60 * 1000; // 1 minute idle (change as needed)
  const COUNTDOWN_SECONDS = 30;  // 30 seconds countdown

  // Refs = never stale, never re-render problems
  const lastActivityMsRef = useRef<number>(Date.now());
  const promptOpenedAtMsRef = useRef<number | null>(null);
  const loopRef = useRef<number | null>(null);

  const [idlePromptOpen, setIdlePromptOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  function markActivityNow() {
    lastActivityMsRef.current = Date.now();
  }

  async function signOutInternal() {
    // stop loop first to avoid any re-open flickers
    if (loopRef.current) window.clearInterval(loopRef.current);
    loopRef.current = null;

    setIdlePromptOpen(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
    promptOpenedAtMsRef.current = null;

    await supabase.auth.signOut();
  }

  function closePromptAndContinue() {
    setIdlePromptOpen(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
    promptOpenedAtMsRef.current = null;
    markActivityNow();
  }

  // ✅ One stable loop controls everything
  useEffect(() => {
    // reset on login state change
    if (loopRef.current) window.clearInterval(loopRef.current);
    loopRef.current = null;

    setIdlePromptOpen(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
    promptOpenedAtMsRef.current = null;
    markActivityNow();

    if (!user) return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const onActivity = () => {
      // ignore activity while modal is open
      if (promptOpenedAtMsRef.current) return;
      markActivityNow();
    };

    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    // loop: checks every 250ms for idle + updates countdown
    loopRef.current = window.setInterval(() => {
      const now = Date.now();

      // If prompt not open yet, check idle
      if (!promptOpenedAtMsRef.current) {
        const idleFor = now - lastActivityMsRef.current;
        if (idleFor >= IDLE_MS) {
          promptOpenedAtMsRef.current = now; // lock open time
          setIdlePromptOpen(true);
          setSecondsLeft(COUNTDOWN_SECONDS);
        }
        return;
      }

      // Prompt is open -> countdown based on real time since opened
      const elapsed = Math.floor((now - promptOpenedAtMsRef.current) / 1000);
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        // auto logout
        signOutInternal();
      }
    }, 250);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity as any));
      if (loopRef.current) window.clearInterval(loopRef.current);
      loopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, IDLE_MS, COUNTDOWN_SECONDS]);

  // Restore session + listen for auth changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const displayName = useMemo(() => getUpperFirstName(user), [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signOut: async () => {
        await signOutInternal();
      },
      displayName,
    }),
    [session, user, loading, displayName]
  );

  return (
    <AuthContext.Provider value={value}>
      <InactivityModal
        open={!!user && idlePromptOpen}
        secondsLeft={secondsLeft}
        onStay={closePromptAndContinue}
        onLogout={signOutInternal}
        onDismissOverlay={closePromptAndContinue}
      />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
