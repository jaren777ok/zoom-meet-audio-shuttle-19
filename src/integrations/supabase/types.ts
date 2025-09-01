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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_analysis_conversations: {
        Row: {
          ad_id: string
          conversation_id: string
          conversation_type: string | null
          created_at: string
          id: string
          initial_analysis_sent: boolean | null
          started_at_ms: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          conversation_id: string
          conversation_type?: string | null
          created_at?: string
          id?: string
          initial_analysis_sent?: boolean | null
          started_at_ms?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          conversation_id?: string
          conversation_type?: string | null
          created_at?: string
          id?: string
          initial_analysis_sent?: boolean | null
          started_at_ms?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_analysis_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          message_type: string | null
          sender_type: string
          webhook_payload: Json | null
          webhook_response: Json | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          sender_type: string
          webhook_payload?: Json | null
          webhook_response?: Json | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          sender_type?: string
          webhook_payload?: Json | null
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analysis_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ad_analysis_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analisis_conversaciones: {
        Row: {
          analisis_markdown: string | null
          contacto_id: string | null
          conversacion_id: string
          created_at: string
          id: string
          metricas_json: Json | null
          sesion_analisis_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analisis_markdown?: string | null
          contacto_id?: string | null
          conversacion_id: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          sesion_analisis_id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analisis_markdown?: string | null
          contacto_id?: string | null
          conversacion_id?: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          sesion_analisis_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_conversaciones_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos_gohighlevel"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          account_id: string
          created_at: string
          date_start: string
          date_stop: string
          id: string
          page_id: string
          session_name: string
          session_timestamp: number | null
          time_range_days: number
          total_ads: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          date_start: string
          date_stop: string
          id?: string
          page_id: string
          session_name: string
          session_timestamp?: number | null
          time_range_days: number
          total_ads?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          date_start?: string
          date_stop?: string
          id?: string
          page_id?: string
          session_name?: string
          session_timestamp?: number | null
          time_range_days?: number
          total_ads?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blotato_accounts: {
        Row: {
          api_key_encrypted: string
          created_at: string
          facebook_account_id: string | null
          facebook_page_id: string | null
          id: string
          instagram_account_id: string | null
          tiktok_account_id: string | null
          updated_at: string
          user_id: string
          youtube_account_id: string | null
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          facebook_account_id?: string | null
          facebook_page_id?: string | null
          id?: string
          instagram_account_id?: string | null
          tiktok_account_id?: string | null
          updated_at?: string
          user_id: string
          youtube_account_id?: string | null
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          facebook_account_id?: string | null
          facebook_page_id?: string | null
          id?: string
          instagram_account_id?: string | null
          tiktok_account_id?: string | null
          updated_at?: string
          user_id?: string
          youtube_account_id?: string | null
        }
        Relationships: []
      }
      chats: {
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
          title: string
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
      contactos_gohighlevel: {
        Row: {
          conversacion_id: string
          created_at: string
          id: string
          nombre_contacto: string
          sesion_obtener_id: string | null
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversacion_id: string
          created_at?: string
          id?: string
          nombre_contacto: string
          sesion_obtener_id?: string | null
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversacion_id?: string
          created_at?: string
          id?: string
          nombre_contacto?: string
          sesion_obtener_id?: string | null
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_gohighlevel_sesion_obtener_id_fkey"
            columns: ["sesion_obtener_id"]
            isOneToOne: false
            referencedRelation: "sesion_obtener_contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_mensajes: {
        Row: {
          contacto_id: string
          created_at: string
          id: string
          mensajes: Json
          updated_at: string
        }
        Insert: {
          contacto_id: string
          created_at?: string
          id?: string
          mensajes?: Json
          updated_at?: string
        }
        Update: {
          contacto_id?: string
          created_at?: string
          id?: string
          mensajes?: Json
          updated_at?: string
        }
        Relationships: []
      }
      document_embeddings_duplicate: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          config_data: Json | null
          created_at: string
          duration: number | null
          heygen_video_id: string | null
          id: string
          request_id: string | null
          script: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string
          duration?: number | null
          heygen_video_id?: string | null
          id?: string
          request_id?: string | null
          script?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string
          duration?: number | null
          heygen_video_id?: string | null
          id?: string
          request_id?: string | null
          script?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      gohighlevel_config: {
        Row: {
          account_id: string
          api_key: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heygen_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_key_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_key_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          document_id: string
          file_size: number
          file_type: string
          filename: string
          id: string
          processed_at: string | null
          upload_status: string
          uploaded_at: string
          user_id: string
          vectorization_status: string
          webhook_response: Json | null
        }
        Insert: {
          document_id: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          processed_at?: string | null
          upload_status?: string
          uploaded_at?: string
          user_id: string
          vectorization_status?: string
          webhook_response?: Json | null
        }
        Update: {
          document_id?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          processed_at?: string | null
          upload_status?: string
          uploaded_at?: string
          user_id?: string
          vectorization_status?: string
          webhook_response?: Json | null
        }
        Relationships: []
      }
      meeting_configurations: {
        Row: {
          company_info: string
          created_at: string
          id: string
          meeting_objective: string
          number_of_people: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_info: string
          created_at?: string
          id?: string
          meeting_objective: string
          number_of_people: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_info?: string
          created_at?: string
          id?: string
          meeting_objective?: string
          number_of_people?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_sessions: {
        Row: {
          company_info: string
          created_at: string
          id: string
          meeting_objective: string
          number_of_people: number
          session_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_info: string
          created_at?: string
          id?: string
          meeting_objective: string
          number_of_people: number
          session_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_info?: string
          created_at?: string
          id?: string
          meeting_objective?: string
          number_of_people?: number
          session_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          images: string[] | null
          role: string
          timestamp: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          role: string
          timestamp?: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          role?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_adsets: {
        Row: {
          account_id: string
          adset_id: string
          adset_name: string
          analysis_session_id: string | null
          avg_cpc: number | null
          avg_ctr: number | null
          campaign_id: string
          campaign_supabase_id: string | null
          created_at: string
          id: string
          page_id: string | null
          total_ads: number | null
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          adset_id: string
          adset_name: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id: string
          campaign_supabase_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          total_ads?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          adset_id?: string
          adset_name?: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id?: string
          campaign_supabase_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          total_ads?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_adsets_analysis_session"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_adsets_campaign_supabase_id_fkey"
            columns: ["campaign_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_campaigns: {
        Row: {
          account_id: string
          analysis_session_id: string | null
          avg_cpc: number | null
          avg_ctr: number | null
          campaign_id: string
          campaign_name: string
          color_tag: string | null
          created_at: string
          funnel_position: number | null
          id: string
          page_id: string | null
          pipeline_stage_id: string | null
          total_ads: number
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          account_id: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id: string
          campaign_name: string
          color_tag?: string | null
          created_at?: string
          funnel_position?: number | null
          id?: string
          page_id?: string | null
          pipeline_stage_id?: string | null
          total_ads?: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          account_id?: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id?: string
          campaign_name?: string
          color_tag?: string | null
          created_at?: string
          funnel_position?: number | null
          id?: string
          page_id?: string | null
          pipeline_stage_id?: string | null
          total_ads?: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaigns_analysis_session"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_campaigns_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_connections: {
        Row: {
          account_id: string
          api_key: string
          created_at: string
          currency: string
          id: string
          label: string | null
          last_used_at: string | null
          page_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key?: string
          created_at?: string
          currency: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          page_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          created_at?: string
          currency?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          page_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_ads_creatives: {
        Row: {
          account_id: string
          action_values: Json | null
          actions: Json | null
          ad_body: string | null
          ad_description: string | null
          ad_id: string
          ad_name: string
          ad_title: string | null
          adset_id: string | null
          adset_supabase_id: string | null
          analysis_session_id: string | null
          call_to_action: string | null
          campaign_id: string | null
          campaign_objective: string | null
          campaign_supabase_id: string | null
          carousel_id: string | null
          clicks: number | null
          conversions: number | null
          cost_per_action_type: Json | null
          cost_per_conversion: number | null
          cost_per_inline_link_click: number | null
          cost_per_outbound_click: Json | null
          cpc: number | null
          cpm: number | null
          created_at: string
          creative_analysis: string | null
          creative_type: string | null
          creative_url: string | null
          ctr: number | null
          date_start: string | null
          date_stop: string | null
          frequency: number | null
          id: string
          impressions: number | null
          inline_link_click_ctr: number | null
          inline_link_clicks: number | null
          media_height: number | null
          media_width: number | null
          metrics_analysis: string | null
          outbound_clicks: Json | null
          page_icon_url: string | null
          page_id: string | null
          page_name: string | null
          performance_score: number | null
          purchase_roas: Json | null
          reach: number | null
          recommendations: Json | null
          spend: number | null
          unique_clicks: number | null
          unique_ctr: number | null
          updated_at: string
          user_id: string
          video_avg_time_watched_actions: Json | null
          video_p100_watched_actions: Json | null
          video_p25_watched_actions: Json | null
          video_p50_watched_actions: Json | null
          video_p75_watched_actions: Json | null
          video_p95_watched_actions: Json | null
          website_purchase_roas: Json | null
        }
        Insert: {
          account_id: string
          action_values?: Json | null
          actions?: Json | null
          ad_body?: string | null
          ad_description?: string | null
          ad_id: string
          ad_name: string
          ad_title?: string | null
          adset_id?: string | null
          adset_supabase_id?: string | null
          analysis_session_id?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          campaign_objective?: string | null
          campaign_supabase_id?: string | null
          carousel_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_outbound_click?: Json | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          creative_analysis?: string | null
          creative_type?: string | null
          creative_url?: string | null
          ctr?: number | null
          date_start?: string | null
          date_stop?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          media_height?: number | null
          media_width?: number | null
          metrics_analysis?: string | null
          outbound_clicks?: Json | null
          page_icon_url?: string | null
          page_id?: string | null
          page_name?: string | null
          performance_score?: number | null
          purchase_roas?: Json | null
          reach?: number | null
          recommendations?: Json | null
          spend?: number | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string
          user_id: string
          video_avg_time_watched_actions?: Json | null
          video_p100_watched_actions?: Json | null
          video_p25_watched_actions?: Json | null
          video_p50_watched_actions?: Json | null
          video_p75_watched_actions?: Json | null
          video_p95_watched_actions?: Json | null
          website_purchase_roas?: Json | null
        }
        Update: {
          account_id?: string
          action_values?: Json | null
          actions?: Json | null
          ad_body?: string | null
          ad_description?: string | null
          ad_id?: string
          ad_name?: string
          ad_title?: string | null
          adset_id?: string | null
          adset_supabase_id?: string | null
          analysis_session_id?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          campaign_objective?: string | null
          campaign_supabase_id?: string | null
          carousel_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_outbound_click?: Json | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          creative_analysis?: string | null
          creative_type?: string | null
          creative_url?: string | null
          ctr?: number | null
          date_start?: string | null
          date_stop?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          media_height?: number | null
          media_width?: number | null
          metrics_analysis?: string | null
          outbound_clicks?: Json | null
          page_icon_url?: string | null
          page_id?: string | null
          page_name?: string | null
          performance_score?: number | null
          purchase_roas?: Json | null
          reach?: number | null
          recommendations?: Json | null
          spend?: number | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string
          user_id?: string
          video_avg_time_watched_actions?: Json | null
          video_p100_watched_actions?: Json | null
          video_p25_watched_actions?: Json | null
          video_p50_watched_actions?: Json | null
          video_p75_watched_actions?: Json | null
          video_p95_watched_actions?: Json | null
          website_purchase_roas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_creatives_adset_supabase_id_fkey"
            columns: ["adset_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_adsets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_creatives_analysis_session_id_fkey"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_creatives_campaign_supabase_id_fkey"
            columns: ["campaign_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_agente_videos: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_clonegame: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          page_id: string | null
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          page_id?: string | null
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          page_id?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_access_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_files: {
        Row: {
          area: string
          created_at: string
          drive_url: string
          id: string
          notes: string | null
          project_title: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          drive_url: string
          id?: string
          notes?: string | null
          project_title: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          drive_url?: string
          id?: string
          notes?: string | null
          project_title?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          progress: number
          project_title: string
          request_id: string
          result_url: string | null
          started_at: string
          status: Database["public"]["Enums"]["processing_status"]
          total_files: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          project_title: string
          request_id: string
          result_url?: string | null
          started_at?: string
          status: Database["public"]["Enums"]["processing_status"]
          total_files: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          project_title?: string
          request_id?: string
          result_url?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["processing_status"]
          total_files?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sesion_obtener_contactos: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          analisis_markdown: string | null
          analysis_status: string
          created_at: string
          id: string
          metricas_json: Json | null
          session_id: string
          session_name: string | null
          updated_at: string
          url: string | null
          user_id: string
          webhook_sent_at: string | null
        }
        Insert: {
          analisis_markdown?: string | null
          analysis_status?: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          session_id: string
          session_name?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          webhook_sent_at?: string | null
        }
        Update: {
          analisis_markdown?: string | null
          analysis_status?: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          session_id?: string
          session_name?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          webhook_sent_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription_type: string
          trial_end_date: string
          trial_start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription_type?: string
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription_type?: string
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_video_configs: {
        Row: {
          api_key_id: string | null
          avatar_data: Json | null
          card_customization: Json | null
          config_data: Json
          created_at: string
          current_step: string | null
          generated_script: string | null
          id: string
          manual_customization: Json | null
          presenter_customization: Json | null
          second_avatar_data: Json | null
          session_id: string | null
          style_data: Json | null
          subtitle_customization: Json | null
          updated_at: string
          user_id: string
          voice_data: Json | null
        }
        Insert: {
          api_key_id?: string | null
          avatar_data?: Json | null
          card_customization?: Json | null
          config_data?: Json
          created_at?: string
          current_step?: string | null
          generated_script?: string | null
          id?: string
          manual_customization?: Json | null
          presenter_customization?: Json | null
          second_avatar_data?: Json | null
          session_id?: string | null
          style_data?: Json | null
          subtitle_customization?: Json | null
          updated_at?: string
          user_id: string
          voice_data?: Json | null
        }
        Update: {
          api_key_id?: string | null
          avatar_data?: Json | null
          card_customization?: Json | null
          config_data?: Json
          created_at?: string
          current_step?: string | null
          generated_script?: string | null
          id?: string
          manual_customization?: Json | null
          presenter_customization?: Json | null
          second_avatar_data?: Json | null
          session_id?: string | null
          style_data?: Json | null
          subtitle_customization?: Json | null
          updated_at?: string
          user_id?: string
          voice_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_configs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "heygen_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generation_tracking: {
        Row: {
          created_at: string
          error_message: string | null
          heygen_video_id: string | null
          id: string
          progress: number | null
          request_id: string | null
          script: string | null
          status: string
          updated_at: string
          user_id: string
          video_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          progress?: number | null
          request_id?: string | null
          script?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          progress?: number | null
          request_id?: string | null
          script?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_tracking_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "generated_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      generate_analysis_session_id: {
        Args: {
          p_account_id: string
          p_date_start: string
          p_date_stop: string
          p_page_id: string
          p_session_name: string
          p_time_range_days: number
          p_user_id: string
        }
        Returns: string
      }
      generate_document_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      generate_next_request_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_user_documents: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          user_filter: string
        }
        Returns: {
          content: string
          document_id: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      request_id_exists: {
        Args: { request_id_param: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      processing_status: "completed" | "error" | "timeout"
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
      processing_status: ["completed", "error", "timeout"],
    },
  },
} as const
