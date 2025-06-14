
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://txnpkskyowxdbpdfwnko.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bnBrc2t5b3d4ZGJwZGZ3bmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDMyODcsImV4cCI6MjA2NTQxOTI4N30.5JeTXYJbJLVJgMX6B5Oug04eUXwJkXuVrJMHM-RP-PU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      boxes: {
        Row: {
          id: string
          dimensions: {
            length: number
            width: number
            height: number
          }
          weight: number
          destination: string
          is_fragile: boolean
          created_at: string
          position?: {
            x: number
            y: number
            z: number
          }
        }
        Insert: {
          id: string
          dimensions: {
            length: number
            width: number
            height: number
          }
          weight: number
          destination: string
          is_fragile: boolean
          created_at?: string
          position?: {
            x: number
            y: number
            z: number
          }
        }
        Update: {
          id?: string
          dimensions?: {
            length: number
            width: number
            height: number
          }
          weight?: number
          destination?: string
          is_fragile?: boolean
          created_at?: string
          position?: {
            x: number
            y: number
            z: number
          }
        }
      }
    }
  }
}
