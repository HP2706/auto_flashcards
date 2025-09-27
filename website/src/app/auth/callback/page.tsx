"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const hasHashToken = typeof window !== 'undefined' && window.location.hash.includes('access_token');
        if (!hasHashToken) {
          // Handle PKCE/code flow (query param). If this isn't a PKCE URL, the
          // client will throw and we fall back to implicit/no-op handling.
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        } else {
          // For implicit flow, the Supabase client auto-detects and stores the
          // session on initialization. We can optionally wait a tick.
          await new Promise((r) => setTimeout(r, 50));
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
