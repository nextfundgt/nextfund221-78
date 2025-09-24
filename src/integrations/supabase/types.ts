export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json | null
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_user_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          level: number
          referred_user_id: string
          status: string
          transaction_amount: number
          transaction_type: string
          updated_at: string
        }
        Insert: {
          affiliate_user_id: string
          commission_amount?: number
          commission_rate: number
          created_at?: string
          id?: string
          level: number
          referred_user_id: string
          status?: string
          transaction_amount: number
          transaction_type: string
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          level?: number
          referred_user_id?: string
          status?: string
          transaction_amount?: number
          transaction_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_levels: {
        Row: {
          created_at: string
          id: string
          level_1_count: number | null
          level_1_earnings: number | null
          level_10_count: number | null
          level_10_earnings: number | null
          level_2_count: number | null
          level_2_earnings: number | null
          level_3_count: number | null
          level_3_earnings: number | null
          level_4_count: number | null
          level_4_earnings: number | null
          level_5_count: number | null
          level_5_earnings: number | null
          level_6_count: number | null
          level_6_earnings: number | null
          level_7_count: number | null
          level_7_earnings: number | null
          level_8_count: number | null
          level_8_earnings: number | null
          level_9_count: number | null
          level_9_earnings: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_1_count?: number | null
          level_1_earnings?: number | null
          level_10_count?: number | null
          level_10_earnings?: number | null
          level_2_count?: number | null
          level_2_earnings?: number | null
          level_3_count?: number | null
          level_3_earnings?: number | null
          level_4_count?: number | null
          level_4_earnings?: number | null
          level_5_count?: number | null
          level_5_earnings?: number | null
          level_6_count?: number | null
          level_6_earnings?: number | null
          level_7_count?: number | null
          level_7_earnings?: number | null
          level_8_count?: number | null
          level_8_earnings?: number | null
          level_9_count?: number | null
          level_9_earnings?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_1_count?: number | null
          level_1_earnings?: number | null
          level_10_count?: number | null
          level_10_earnings?: number | null
          level_2_count?: number | null
          level_2_earnings?: number | null
          level_3_count?: number | null
          level_3_earnings?: number | null
          level_4_count?: number | null
          level_4_earnings?: number | null
          level_5_count?: number | null
          level_5_earnings?: number | null
          level_6_count?: number | null
          level_6_earnings?: number | null
          level_7_count?: number | null
          level_7_earnings?: number | null
          level_8_count?: number | null
          level_8_earnings?: number | null
          level_9_count?: number | null
          level_9_earnings?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_user_id: string
          created_at: string
          id: string
          referred_user_id: string
          reward_amount: number | null
        }
        Insert: {
          affiliate_user_id: string
          created_at?: string
          id?: string
          referred_user_id: string
          reward_amount?: number | null
        }
        Update: {
          affiliate_user_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          reward_amount?: number | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          clicks_count: number | null
          code: string
          created_at: string
          id: string
          rewards_total: number | null
          signups_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks_count?: number | null
          code: string
          created_at?: string
          id?: string
          rewards_total?: number | null
          signups_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks_count?: number | null
          code?: string
          created_at?: string
          id?: string
          rewards_total?: number | null
          signups_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          coupon_type: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          reward_amount: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_type?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_prices: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          market_cap: number | null
          name: string
          price: number
          price_change_24h: number | null
          price_change_percentage_24h: number | null
          symbol: string
          volume_24h: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          market_cap?: number | null
          name: string
          price: number
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol: string
          volume_24h?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          market_cap?: number | null
          name?: string
          price?: number
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          symbol?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      expert_investment_plans: {
        Row: {
          annual_rate: number
          badge: string | null
          category: string
          created_at: string
          daily_rate: number
          description: string | null
          duration_days: number
          expert_id: string
          id: string
          min_amount: number
          name: string
          participants: number | null
          plan_type: string
          previous_rate: number | null
          risk_level: string
          status: string | null
          updated_at: string
        }
        Insert: {
          annual_rate: number
          badge?: string | null
          category: string
          created_at?: string
          daily_rate: number
          description?: string | null
          duration_days: number
          expert_id: string
          id?: string
          min_amount: number
          name: string
          participants?: number | null
          plan_type: string
          previous_rate?: number | null
          risk_level: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          annual_rate?: number
          badge?: string | null
          category?: string
          created_at?: string
          daily_rate?: number
          description?: string | null
          duration_days?: number
          expert_id?: string
          id?: string
          min_amount?: number
          name?: string
          participants?: number | null
          plan_type?: string
          previous_rate?: number | null
          risk_level?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_investment_plans_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "expert_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience_years: number | null
          followers_count: number | null
          id: string
          initials: string
          name: string
          status: string | null
          success_rate: number | null
          total_return: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          followers_count?: number | null
          id?: string
          initials: string
          name: string
          status?: string | null
          success_rate?: number | null
          total_return?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          followers_count?: number | null
          id?: string
          initials?: string
          name?: string
          status?: string | null
          success_rate?: number | null
          total_return?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      investment_plans: {
        Row: {
          amount: number
          created_at: string
          current_value: number | null
          daily_rate: number
          duration_days: number
          id: string
          plan_type: string
          projected_total: number | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          current_value?: number | null
          daily_rate: number
          duration_days: number
          id?: string
          plan_type: string
          projected_total?: number | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          current_value?: number | null
          daily_rate?: number
          duration_days?: number
          id?: string
          plan_type?: string
          projected_total?: number | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_returns: {
        Row: {
          accumulated_return: number
          created_at: string
          daily_return: number
          id: string
          investment_plan_id: string
          return_date: string
          user_id: string
        }
        Insert: {
          accumulated_return?: number
          created_at?: string
          daily_return?: number
          id?: string
          investment_plan_id: string
          return_date?: string
          user_id: string
        }
        Update: {
          accumulated_return?: number
          created_at?: string
          daily_return?: number
          id?: string
          investment_plan_id?: string
          return_date?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_trades: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          price: number
          quantity: number
          side: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          id?: string
          price: number
          quantity: number
          side: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          side?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_banners: {
        Row: {
          button_text: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          api_endpoint: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          provider: string
          required_fields: Json | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          provider: string
          required_fields?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          provider?: string
          required_fields?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliate_code: string | null
          avatar_url: string | null
          balance: number | null
          created_at: string
          current_vip_level: number | null
          extra_videos_available: number | null
          full_name: string
          id: string
          referred_by: string | null
          total_video_earnings: number | null
          updated_at: string
          user_id: string
          user_number: number
          vip_expires_at: string | null
        }
        Insert: {
          affiliate_code?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string
          current_vip_level?: number | null
          extra_videos_available?: number | null
          full_name: string
          id?: string
          referred_by?: string | null
          total_video_earnings?: number | null
          updated_at?: string
          user_id: string
          user_number?: number
          vip_expires_at?: string | null
        }
        Update: {
          affiliate_code?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string
          current_vip_level?: number | null
          extra_videos_available?: number | null
          full_name?: string
          id?: string
          referred_by?: string | null
          total_video_earnings?: number | null
          updated_at?: string
          user_id?: string
          user_number?: number
          vip_expires_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string | null
          response: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          response?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cpf: string | null
          created_at: string
          email: string | null
          end_to_end_id: string | null
          id: string
          method: string | null
          name: string | null
          notes: string | null
          pix_key: string | null
          processed_at: string | null
          qr_code_id: string | null
          qr_code_image: string | null
          status: string
          transfer_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          end_to_end_id?: string | null
          id?: string
          method?: string | null
          name?: string | null
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          qr_code_id?: string | null
          qr_code_image?: string | null
          status?: string
          transfer_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          end_to_end_id?: string | null
          id?: string
          method?: string | null
          name?: string | null
          notes?: string | null
          pix_key?: string | null
          processed_at?: string | null
          qr_code_id?: string | null
          qr_code_image?: string | null
          status?: string
          transfer_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          commission_rate: number | null
          created_at: string
          current_level: number | null
          daily_limit: number | null
          daily_tasks_completed: number | null
          id: string
          level_progress: number | null
          total_earnings: number | null
          total_tasks_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          current_level?: number | null
          daily_limit?: number | null
          daily_tasks_completed?: number | null
          id?: string
          level_progress?: number | null
          total_earnings?: number | null
          total_tasks_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          current_level?: number | null
          daily_limit?: number | null
          daily_tasks_completed?: number | null
          id?: string
          level_progress?: number | null
          total_earnings?: number | null
          total_tasks_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_payment_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_gateway_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_gateway_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_gateway_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_preferences_preferred_gateway_id_fkey"
            columns: ["preferred_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          animations_enabled: boolean
          created_at: string
          dark_theme: boolean
          id: string
          notifications_email: boolean
          notifications_marketing: boolean
          notifications_push: boolean
          notifications_sms: boolean
          show_balance: boolean
          sounds_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          animations_enabled?: boolean
          created_at?: string
          dark_theme?: boolean
          id?: string
          notifications_email?: boolean
          notifications_marketing?: boolean
          notifications_push?: boolean
          notifications_sms?: boolean
          show_balance?: boolean
          sounds_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          animations_enabled?: boolean
          created_at?: string
          dark_theme?: boolean
          id?: string
          notifications_email?: boolean
          notifications_marketing?: boolean
          notifications_push?: boolean
          notifications_sms?: boolean
          show_balance?: boolean
          sounds_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_video_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
          video_task_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
          video_task_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
          video_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_video_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "video_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_completions: {
        Row: {
          bonus_amount: number | null
          completed_at: string | null
          created_at: string
          id: string
          reward_earned: number | null
          status: string | null
          user_id: string
          video_task_id: string
          vip_bonus_applied: boolean | null
          watch_time_seconds: number | null
        }
        Insert: {
          bonus_amount?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          reward_earned?: number | null
          status?: string | null
          user_id: string
          video_task_id: string
          vip_bonus_applied?: boolean | null
          watch_time_seconds?: number | null
        }
        Update: {
          bonus_amount?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          reward_earned?: number | null
          status?: string | null
          user_id?: string
          video_task_id?: string
          vip_bonus_applied?: boolean | null
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_completions_video_task_id_fkey"
            columns: ["video_task_id"]
            isOneToOne: false
            referencedRelation: "video_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vip_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          expires_at: string
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
          vip_plan_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          vip_plan_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          vip_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vip_subscriptions_vip_plan_id_fkey"
            columns: ["vip_plan_id"]
            isOneToOne: false
            referencedRelation: "vip_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      video_questions: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          option_a: string
          option_b: string
          question_text: string
          updated_at: string
          video_task_id: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          question_text: string
          updated_at?: string
          video_task_id: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          question_text?: string
          updated_at?: string
          video_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_questions_video_task_id_fkey"
            columns: ["video_task_id"]
            isOneToOne: false
            referencedRelation: "video_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tasks: {
        Row: {
          category: string | null
          created_at: string
          created_by_admin: boolean
          description: string | null
          duration_seconds: number | null
          id: string
          is_premium: boolean | null
          reward_amount: number | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number | null
          vip_level_required: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by_admin?: boolean
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_premium?: boolean | null
          reward_amount?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number | null
          vip_level_required?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by_admin?: boolean
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_premium?: boolean | null
          reward_amount?: number | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number | null
          vip_level_required?: number | null
        }
        Relationships: []
      }
      video_watch_sessions: {
        Row: {
          actual_watch_time: number | null
          ended_at: string | null
          id: string
          is_completed: boolean | null
          is_fraudulent: boolean | null
          last_valid_position: number | null
          minimum_required_time: number | null
          pause_count: number | null
          seek_attempts: number | null
          started_at: string
          tab_switches: number | null
          user_id: string
          video_task_id: string
          watch_duration: number | null
          watched_segments: Json | null
        }
        Insert: {
          actual_watch_time?: number | null
          ended_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_fraudulent?: boolean | null
          last_valid_position?: number | null
          minimum_required_time?: number | null
          pause_count?: number | null
          seek_attempts?: number | null
          started_at?: string
          tab_switches?: number | null
          user_id: string
          video_task_id: string
          watch_duration?: number | null
          watched_segments?: Json | null
        }
        Update: {
          actual_watch_time?: number | null
          ended_at?: string | null
          id?: string
          is_completed?: boolean | null
          is_fraudulent?: boolean | null
          last_valid_position?: number | null
          minimum_required_time?: number | null
          pause_count?: number | null
          seek_attempts?: number | null
          started_at?: string
          tab_switches?: number | null
          user_id?: string
          video_task_id?: string
          watch_duration?: number | null
          watched_segments?: Json | null
        }
        Relationships: []
      }
      vip_plans: {
        Row: {
          benefits: Json
          created_at: string
          daily_video_limit: number
          duration_days: number
          id: string
          level: number
          name: string
          price: number
          reward_multiplier: number
          status: string
          updated_at: string
          video_access_level: number
        }
        Insert: {
          benefits?: Json
          created_at?: string
          daily_video_limit?: number
          duration_days?: number
          id?: string
          level: number
          name: string
          price: number
          reward_multiplier?: number
          status?: string
          updated_at?: string
          video_access_level?: number
        }
        Update: {
          benefits?: Json
          created_at?: string
          daily_video_limit?: number
          duration_days?: number
          id?: string
          level?: number
          name?: string
          price?: number
          reward_multiplier?: number
          status?: string
          updated_at?: string
          video_access_level?: number
        }
        Relationships: []
      }
      wallet_history: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_table: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_affiliate_commissions: {
        Args: {
          p_referred_user_id: string
          p_transaction_amount: number
          p_transaction_type: string
        }
        Returns: undefined
      }
      calculate_free_user_reward: {
        Args: {
          p_completion_id: string
          p_user_id: string
          p_video_task_id: string
        }
        Returns: Json
      }
      create_investment_transaction: {
        Args: {
          p_amount: number
          p_daily_rate: number
          p_duration_days: number
          p_plan_type: string
          p_user_id: string
        }
        Returns: Json
      }
      fix_existing_users_affiliate_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_affiliate_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_referral_link: {
        Args: { user_number_param: number }
        Returns: string
      }
      get_user_profile_safe: {
        Args: { p_user_id: string }
        Returns: {
          affiliate_code: string
          balance: number
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }[]
      }
      handle_video_completion_with_vip: {
        Args: {
          p_completion_id: string
          p_user_id: string
          p_video_task_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      reset_daily_video_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_video_session: {
        Args: { required_percentage?: number; session_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
