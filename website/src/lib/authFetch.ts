"use client";

import { supabase } from "@/lib/supabase";

export async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

