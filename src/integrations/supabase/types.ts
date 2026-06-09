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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: number
          path: string | null
          props: Json | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: number
          path?: string | null
          props?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: number
          path?: string | null
          props?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      approval_audit_log: {
        Row: {
          action: string
          actor_label: string | null
          actor_user_id: string | null
          approval_id: string
          client_comment: string | null
          client_name: string | null
          created_at: string
          id: string
          job_id: string
          metadata: Json
          new_status: string | null
          old_status: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_label?: string | null
          actor_user_id?: string | null
          approval_id: string
          client_comment?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          job_id: string
          metadata?: Json
          new_status?: string | null
          old_status?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_label?: string | null
          actor_user_id?: string | null
          approval_id?: string
          client_comment?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          job_id?: string
          metadata?: Json
          new_status?: string | null
          old_status?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          client_comment: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          created_by: string
          decided_at: string | null
          id: string
          job_id: string
          status: string
          token: string
          workspace_id: string | null
        }
        Insert: {
          client_comment?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by: string
          decided_at?: string | null
          id?: string
          job_id: string
          status?: string
          token: string
          workspace_id?: string | null
        }
        Update: {
          client_comment?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string
          decided_at?: string | null
          id?: string
          job_id?: string
          status?: string
          token?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "repurpose_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          linkedin_url: string | null
          name: string
          slug: string
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name: string
          slug: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          slug?: string
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content_md: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          brand_handle: string | null
          brand_name: string | null
          created_at: string
          font_body: string | null
          font_heading: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          preferred_tone: string | null
          primary_color: string | null
          secondary_color: string | null
          tagline: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          accent_color?: string | null
          brand_handle?: string | null
          brand_name?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          preferred_tone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          accent_color?: string | null
          brand_handle?: string | null
          brand_name?: string | null
          created_at?: string
          font_body?: string | null
          font_heading?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          preferred_tone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voices: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          quality_score: number | null
          samples: Json
          style_summary: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          quality_score?: number | null
          samples?: Json
          style_summary?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          quality_score?: number | null
          samples?: Json
          style_summary?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_voices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_uses: {
        Row: {
          created_at: string
          id: number
          input_chars: number | null
          ip_hash: string
        }
        Insert: {
          created_at?: string
          id?: number
          input_chars?: number | null
          ip_hash: string
        }
        Update: {
          created_at?: string
          id?: number
          input_chars?: number | null
          ip_hash?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          aspect: string | null
          created_at: string
          id: string
          image_url: string
          prompt: string
          source: string
          style: string | null
          template: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          aspect?: string | null
          created_at?: string
          id?: string
          image_url: string
          prompt: string
          source?: string
          style?: string | null
          template?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          aspect?: string | null
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          source?: string
          style?: string | null
          template?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics: {
        Row: {
          comments: number | null
          fetched_at: string
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          platform_post_id: string
          scheduled_post_id: string | null
          shares: number | null
          user_id: string
        }
        Insert: {
          comments?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          platform_post_id: string
          scheduled_post_id?: string | null
          shares?: number | null
          user_id: string
        }
        Update: {
          comments?: number | null
          fetched_at?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          platform_post_id?: string
          scheduled_post_id?: string | null
          shares?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_scheduled_post_id_fkey"
            columns: ["scheduled_post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          last_active_date: string | null
          longest_streak: number
          onboarding_completed: boolean
          plan: string
          primary_platforms: Json
          primary_role: string | null
          referral_code: string | null
          referred_by: string | null
          streak_days: number
          tagline: string | null
          updated_at: string
          user_id: string
          weekly_digest_enabled: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed?: boolean
          plan?: string
          primary_platforms?: Json
          primary_role?: string | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          tagline?: string | null
          updated_at?: string
          user_id: string
          weekly_digest_enabled?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed?: boolean
          plan?: string
          primary_platforms?: Json
          primary_role?: string | null
          referral_code?: string | null
          referred_by?: string | null
          streak_days?: number
          tagline?: string | null
          updated_at?: string
          user_id?: string
          weekly_digest_enabled?: boolean
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          reward_granted_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          reward_granted_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          reward_granted_at?: string | null
          status?: string
        }
        Relationships: []
      }
      repurpose_jobs: {
        Row: {
          brand_kit_id: string | null
          created_at: string
          hook_variants: Json
          id: string
          input_text: string
          is_favorite: boolean
          is_featured: boolean
          is_public: boolean
          outputs: Json | null
          public_slug: string | null
          title: string | null
          tool: string
          user_id: string
          view_count: number
          winning_hook_index: number | null
          workspace_id: string | null
        }
        Insert: {
          brand_kit_id?: string | null
          created_at?: string
          hook_variants?: Json
          id?: string
          input_text: string
          is_favorite?: boolean
          is_featured?: boolean
          is_public?: boolean
          outputs?: Json | null
          public_slug?: string | null
          title?: string | null
          tool?: string
          user_id: string
          view_count?: number
          winning_hook_index?: number | null
          workspace_id?: string | null
        }
        Update: {
          brand_kit_id?: string | null
          created_at?: string
          hook_variants?: Json
          id?: string
          input_text?: string
          is_favorite?: boolean
          is_featured?: boolean
          is_public?: boolean
          outputs?: Json | null
          public_slug?: string | null
          title?: string | null
          tool?: string
          user_id?: string
          view_count?: number
          winning_hook_index?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repurpose_jobs_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repurpose_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          brand_kit_id: string | null
          content: string
          created_at: string
          id: string
          platform: string
          platform_post_id: string | null
          publish_error: string | null
          published_at: string | null
          scheduled_for: string
          social_account_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          brand_kit_id?: string | null
          content: string
          created_at?: string
          id?: string
          platform?: string
          platform_post_id?: string | null
          publish_error?: string | null
          published_at?: string | null
          scheduled_for: string
          social_account_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          brand_kit_id?: string | null
          content?: string
          created_at?: string
          id?: string
          platform?: string
          platform_post_id?: string | null
          publish_error?: string | null
          published_at?: string | null
          scheduled_for?: string
          social_account_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          platform: string
          platform_user_id: string
          platform_username: string | null
          refresh_token: string | null
          scopes: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          platform: string
          platform_user_id: string
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          refresh_token?: string | null
          scopes?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      swipe_file: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          platform: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          created_at: string
          custom_instructions: string | null
          description: string | null
          id: string
          is_public: boolean
          name: string
          selected_types: Json
          slug: string | null
          tone: string
          updated_at: string
          use_count: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          custom_instructions?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          selected_types?: Json
          slug?: string | null
          tone?: string
          updated_at?: string
          use_count?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          custom_instructions?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          selected_types?: Json
          slug?: string | null
          tone?: string
          updated_at?: string
          use_count?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_initials: string | null
          avatar_url: string | null
          created_at: string
          handle: string | null
          id: string
          is_published: boolean
          name: string
          quote: string
          rating: number
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_initials?: string | null
          avatar_url?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          is_published?: boolean
          name: string
          quote: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_initials?: string | null
          avatar_url?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          is_published?: boolean
          name?: string
          quote?: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          active_brand_kit_id: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active_brand_kit_id?: string | null
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active_brand_kit_id?: string | null
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
          white_label: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
          white_label?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
          white_label?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_repurpose_outputs: {
        Args: {
          _job_id: string
          _patch: Json
          _title?: string
          _user_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_approval_by_token: { Args: { _token: string }; Returns: Json }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      respond_to_approval: {
        Args: {
          _client_comment: string
          _client_name: string
          _status: string
          _token: string
        }
        Returns: boolean
      }
      workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
