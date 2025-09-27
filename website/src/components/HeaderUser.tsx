"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function HeaderUser() {
  const [email, setEmail] = useState<string | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  if (!email) {
    return (
      <a href="/auth" style={{ padding: '6px 10px', border: '1px solid #334', borderRadius: 6 }}>Sign in</a>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ opacity: 0.8, fontSize: 13 }}>{email}</span>
      <button
        onClick={async () => {
          await signOut();
          window.location.href = '/auth';
        }}
        style={{ padding: '6px 10px', border: '1px solid #334', borderRadius: 6, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
      >
        Sign out
      </button>
    </div>
  );
}

