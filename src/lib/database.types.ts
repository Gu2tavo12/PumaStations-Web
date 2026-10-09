// Types of the public schema of Supabase, written from PumaStations/supabase/schema.sql.
// When the project is linked, regenerate them with `npm run gen:types`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type FuelColumn = 'diesel' | 'regular' | 'premium'
type LossTypeColumn = 'shrinkage' | 'leak' | 'technicalFailure' | 'spill'
type RoleColumn = 'generalManager' | 'branchManager'

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          name: string
          code: string
          address: string
          municipality: string
          phone: string
          created_at: string
          diesel_capacity: number
          regular_capacity: number
          premium_capacity: number
          diesel_stock: number
          regular_stock: number
          premium_stock: number
        }
        Insert: {
          id?: string
          name: string
          code: string
          address: string
          municipality: string
          phone?: string
          created_at?: string
          diesel_capacity: number
          regular_capacity: number
          premium_capacity: number
          diesel_stock?: number
          regular_stock?: number
          premium_stock?: number
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string
          municipality?: string
          phone?: string
          created_at?: string
          diesel_capacity?: number
          regular_capacity?: number
          premium_capacity?: number
          diesel_stock?: number
          regular_stock?: number
          premium_stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: RoleColumn
          dui: string
          phone: string
          is_active: boolean
          created_at: string
          branch_id: string | null
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: RoleColumn
          dui?: string
          phone?: string
          is_active?: boolean
          created_at?: string
          branch_id?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: RoleColumn
          dui?: string
          phone?: string
          is_active?: boolean
          created_at?: string
          branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_branch_id_fkey'
            columns: ['branch_id']
            isOneToOne: true
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
        ]
      }
      pumps: {
        Row: {
          id: string
          branch_id: string
          number: number
        }
        Insert: {
          id?: string
          branch_id: string
          number: number
        }
        Update: {
          id?: string
          branch_id?: string
          number?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pumps_branch_id_fkey'
            columns: ['branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
        ]
      }
      sales_cuts: {
        Row: {
          id: string
          branch_id: string
          day: string
          shift: number
          status: 'open' | 'closed'
          opened_at: string
          closed_at: string | null
          opening_diesel: number
          opening_regular: number
          opening_premium: number
        }
        Insert: {
          id?: string
          branch_id: string
          day: string
          shift: number
          status?: 'open' | 'closed'
          opened_at?: string
          closed_at?: string | null
          opening_diesel?: number
          opening_regular?: number
          opening_premium?: number
        }
        Update: {
          id?: string
          branch_id?: string
          day?: string
          shift?: number
          status?: 'open' | 'closed'
          opened_at?: string
          closed_at?: string | null
          opening_diesel?: number
          opening_regular?: number
          opening_premium?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sales_cuts_branch_id_fkey'
            columns: ['branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['id']
          },
        ]
      }
      pump_sales: {
        Row: {
          id: string
          cut_id: string
          pump_number: number
          is_out_of_service: boolean
          diesel_gallons: number
          diesel_amount: number
          regular_gallons: number
          regular_amount: number
          premium_gallons: number
          premium_amount: number
          recorded_at: string
        }
        Insert: {
          id?: string
          cut_id: string
          pump_number: number
          is_out_of_service?: boolean
          diesel_gallons?: number
          diesel_amount?: number
          regular_gallons?: number
          regular_amount?: number
          premium_gallons?: number
          premium_amount?: number
          recorded_at?: string
        }
        Update: {
          id?: string
          cut_id?: string
          pump_number?: number
          is_out_of_service?: boolean
          diesel_gallons?: number
          diesel_amount?: number
          regular_gallons?: number
          regular_amount?: number
          premium_gallons?: number
          premium_amount?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pump_sales_cut_id_fkey'
            columns: ['cut_id']
            isOneToOne: false
            referencedRelation: 'sales_cuts'
            referencedColumns: ['id']
          },
        ]
      }
      fuel_receptions: {
        Row: {
          id: string
          cut_id: string
          fuel: FuelColumn
          gallons: number
          cost_per_gallon: number
          supplier: string
          invoice_number: string
          received_at: string
        }
        Insert: {
          id?: string
          cut_id: string
          fuel: FuelColumn
          gallons: number
          cost_per_gallon: number
          supplier: string
          invoice_number: string
          received_at?: string
        }
        Update: {
          id?: string
          cut_id?: string
          fuel?: FuelColumn
          gallons?: number
          cost_per_gallon?: number
          supplier?: string
          invoice_number?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fuel_receptions_cut_id_fkey'
            columns: ['cut_id']
            isOneToOne: false
            referencedRelation: 'sales_cuts'
            referencedColumns: ['id']
          },
        ]
      }
      fuel_losses: {
        Row: {
          id: string
          cut_id: string
          type: LossTypeColumn
          fuel: FuelColumn
          gallons: number
          cost_per_gallon: number
          /** null = storage tank */
          pump_number: number | null
          details: string
          recorded_at: string
        }
        Insert: {
          id?: string
          cut_id: string
          type: LossTypeColumn
          fuel: FuelColumn
          gallons: number
          cost_per_gallon: number
          pump_number?: number | null
          details?: string
          recorded_at?: string
        }
        Update: {
          id?: string
          cut_id?: string
          type?: LossTypeColumn
          fuel?: FuelColumn
          gallons?: number
          cost_per_gallon?: number
          pump_number?: number | null
          details?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fuel_losses_cut_id_fkey'
            columns: ['cut_id']
            isOneToOne: false
            referencedRelation: 'sales_cuts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      /** Creates or edits a branch manager (general manager only). */
      save_manager: {
        Args: {
          p_id: string
          p_email: string
          p_password: string
          p_first_name: string
          p_last_name: string
          p_dui: string
          p_phone: string
          p_is_active: boolean
          p_branch_id: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
