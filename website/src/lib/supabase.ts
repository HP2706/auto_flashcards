import { createClient } from '@supabase/supabase-js'

// Prefer server-side envs when available; fall back to public vars for browser
const isServer = typeof window === 'undefined'

const supabaseUrl = isServer
  ? (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)
  : (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)

const supabaseKey = isServer
  ? (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    )
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)

if (!supabaseUrl || !supabaseKey) {
  // Surface a clear, early error to help diagnose env issues
  // This throws only at runtime in the environment that imports this module.
  throw new Error(
    `Missing Supabase configuration. Got url=${!!supabaseUrl}, key=${!!supabaseKey}. ` +
      `Expected SUPABASE_URL/SUPABASE_* for server or NEXT_PUBLIC_* for client.`
  )
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string)

export function createServerSupabase(authHeader?: string) {
  return createClient(supabaseUrl as string, supabaseKey as string, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    },
  })
}

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          title: string | null
          front: string
          back: string
          front_images: string[] | null
          back_images: string[] | null
          group: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title?: string | null
          front: string
          back: string
          front_images?: string[] | null
          back_images?: string[] | null
          group?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          front?: string
          back?: string
          front_images?: string[] | null
          back_images?: string[] | null
          group?: string | null
          updated_at?: string
        }
      }
      review_logs: {
        Row: {
          id: string
          card_id: string
          ts: number
          grade: string
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          ts: number
          grade: string
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          ts?: number
          grade?: string
          duration_ms?: number | null
          created_at?: string
        }
      }
    }
  }
}
