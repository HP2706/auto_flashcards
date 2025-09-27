"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          setError(error.message);
          return;
        }
        // Redirect home after successful session establishment
        window.location.replace("/");
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    }
    run();
  }, []);

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Completing sign-in…</h1>
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
    </main>
  );
}

