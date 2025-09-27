"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'redirecting'>('checking');

  useEffect(() => {
    let mounted = true;
    async function run() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session?.access_token) {
        setStatus('ok');
      } else {
        setStatus('redirecting');
        if (typeof window !== 'undefined') window.location.replace('/auth');
      }
    }
    run();
    return () => { mounted = false };
  }, []);

  if (status !== 'ok') {
    return <div style={{ padding: 16, opacity: 0.8 }}>Checking authentication…</div>;
  }
  return <>{children}</>;
}

