"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The Supabase client is configured with detectSessionInUrl=true, so it will
    // automatically handle both implicit and PKCE callbacks on initialization.
    // Here we just wait until a session exists, then redirect.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        window.location.replace('/');
      }
    }).catch((e) => setError(e?.message || String(e)));

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (cancelled) return;
      if (session) {
        window.location.replace('/');
      }
    });

    return () => {
      cancelled = true;
      sub.subscription?.unsubscribe();
    };
  }, []);

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Completing sign-in…</h1>
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
    </main>
  );
}
