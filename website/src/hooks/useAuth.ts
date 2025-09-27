"use client";

import { supabase } from "@/lib/supabase";

export function useAuth() {
  async function signUp(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: displayName ? { display_name: displayName } : undefined,
        emailRedirectTo: typeof window !== 'undefined' ? `${location.origin}/auth/callback` : undefined,
      },
    });
    return { data, error };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== 'undefined' ? `${location.origin}/auth/callback` : undefined,
        queryParams: { prompt: 'select_account' },
      },
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  return { signUp, signIn, signInWithGoogle, signOut };
}

