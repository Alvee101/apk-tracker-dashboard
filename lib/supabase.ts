import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export createClient function for use in components
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Types
export interface App {
  id: number
  app_key: string
  app_name: string
  package_name: string
  created_at: string
}

export interface AppInstall {
  id: number
  app_key: string
  device_id: string
  package_name: string
  installed_at: string
}

export interface AppOpen {
  id: number
  app_key: string
  device_id: string
  opened_at: string
}
