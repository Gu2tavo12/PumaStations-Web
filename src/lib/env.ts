import { z } from 'zod'

const envSchema = z.object({
  // Only the project origin: supabase-js adds /auth/v1, /rest/v1… itself. A URL copied with
  // a path (e.g. `https://x.supabase.co/rest/v1/`) makes every call fail with
  // "Invalid path specified in request URL", so the path is dropped.
  VITE_SUPABASE_URL: z.url().transform((value) => new URL(value).origin),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
})

const parsed = envSchema.safeParse(import.meta.env)

/** Supabase settings; null when `.env.local` is missing or invalid. */
export const env = parsed.success
  ? {
      supabaseUrl: parsed.data.VITE_SUPABASE_URL,
      supabasePublishableKey: parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY,
    }
  : null
