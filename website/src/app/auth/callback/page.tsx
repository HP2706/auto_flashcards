"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const hasHashToken = typeof window !== 'undefined' && window.location.hash.includes('access_token');
        if (hasHashToken) {
          // Handle implicit flow (hash fragment)
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
        } else {
          // Handle PKCE/code flow (query param)
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }
        // Redirect home after successful session establishment
        window.location.replace('/');
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
