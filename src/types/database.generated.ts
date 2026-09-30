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
      game_difficulties: {
        Row: {
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          game_id: string
          id: string
        }
        Insert: {
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          game_id: string
          id?: string
        }
        Update: {
          difficulty?: Database["public"]["Enums"]["word_difficulty"]
          game_id?: string
          id?: string
        }
        Relationships: []
      }
      game_lists: {
        Row: {
          game_id: string
          id: string
          list_id: string
        }
        Insert: {
          game_id: string
          id?: string
          list_id: string
        }
        Update: {
          game_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          created_at: string
          id: string
          nickname: string
          player_order: number
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          player_order: number
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          player_order?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rounds: {
        Row: {
          created_at: string
          ended_at: string | null
          explainer_player_id: string
          game_id: string
          guessed_count: number
          id: string
          last_word_id: string | null
          points_earned: number
          paused_at: string | null
          paused_seconds: number
          round_number: number
          skipped_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["round_status"]
          team_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          explainer_player_id: string
          game_id: string
          guessed_count?: number
          id?: string
          last_word_id?: string | null
          points_earned?: number
          paused_at?: string | null
          paused_seconds?: number
          round_number: number
          skipped_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          team_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          explainer_player_id?: string
          game_id?: string
          guessed_count?: number
          id?: string
          last_word_id?: string | null
          points_earned?: number
          paused_at?: string | null
          paused_seconds?: number
          round_number?: number
          skipped_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["round_status"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_explainer_player_id_fkey"
            columns: ["explainer_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_last_word_fk"
            columns: ["last_word_id"]
            isOneToOne: false
            referencedRelation: "round_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rounds_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_teams: {
        Row: {
          created_at: string
          game_id: string
          id: string
          name: string
          score: number
          team_order: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          name: string
          score?: number
          team_order: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          name?: string
          score?: number
          team_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          current_explainer_player_id: string | null
          current_round_number: number
          current_team_id: string | null
          finished_at: string | null
          id: string
          owner_id: string
          round_duration_seconds: number
          selected_difficulties: Database["public"]["Enums"]["word_difficulty"][]
          selected_lists: string[]
          status: Database["public"]["Enums"]["game_status"]
          subtract_point_for_skip: boolean
          target_score: number
        }
        Insert: {
          created_at?: string
          current_explainer_player_id?: string | null
          current_round_number?: number
          current_team_id?: string | null
          finished_at?: string | null
          id?: string
          owner_id: string
          round_duration_seconds: number
          selected_difficulties: Database["public"]["Enums"]["word_difficulty"][]
          selected_lists: string[]
          status?: Database["public"]["Enums"]["game_status"]
          subtract_point_for_skip?: boolean
          target_score: number
        }
        Update: {
          created_at?: string
          current_explainer_player_id?: string | null
          current_round_number?: number
          current_team_id?: string | null
          finished_at?: string | null
          id?: string
          owner_id?: string
          round_duration_seconds?: number
          selected_difficulties?: Database["public"]["Enums"]["word_difficulty"][]
          selected_lists?: string[]
          status?: Database["public"]["Enums"]["game_status"]
          subtract_point_for_skip?: boolean
          target_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "games_current_player_fk"
            columns: ["current_explainer_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_current_team_fk"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_permissions: {
        Row: {
          can_add_words: boolean
          can_delete_words: boolean
          can_edit_words: boolean
          can_view: boolean
          created_at: string
          id: string
          list_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_add_words?: boolean
          can_delete_words?: boolean
          can_edit_words?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          list_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_add_words?: boolean
          can_delete_words?: boolean
          can_edit_words?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          list_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_permissions_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_share_links: {
        Row: {
          can_add_words: boolean
          can_delete_words: boolean
          can_edit_words: boolean
          can_view: boolean
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          list_id: string
          token: string
        }
        Insert: {
          can_add_words?: boolean
          can_delete_words?: boolean
          can_edit_words?: boolean
          can_view?: boolean
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          list_id: string
          token: string
        }
        Update: {
          can_add_words?: boolean
          can_delete_words?: boolean
          can_edit_words?: boolean
          can_view?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          list_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_share_links_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_words: {
        Row: {
          added_by: string
          created_at: string
          id: string
          list_id: string
          word_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          list_id: string
          word_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          list_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_words_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_words_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nickname: string
          profile_setup_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nickname: string
          profile_setup_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nickname?: string
          profile_setup_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      round_words: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          displayed_order: number
          guessed_by_team_id: string | null
          id: string
          is_last_word_for_all: boolean
          result: Database["public"]["Enums"]["word_result"] | null
          round_id: string
          word_id: string
          word_text: string
        }
        Insert: {
          created_at?: string
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          displayed_order: number
          guessed_by_team_id?: string | null
          id?: string
          is_last_word_for_all?: boolean
          result?: Database["public"]["Enums"]["word_result"] | null
          round_id: string
          word_id: string
          word_text: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["word_difficulty"]
          displayed_order?: number
          guessed_by_team_id?: string | null
          id?: string
          is_last_word_for_all?: boolean
          result?: Database["public"]["Enums"]["word_result"] | null
          round_id?: string
          word_id?: string
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_words_guessed_by_team_id_fkey"
            columns: ["guessed_by_team_id"]
            isOneToOne: false
            referencedRelation: "game_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_words_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "game_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          id: string
          owner_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          id?: string
          owner_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["word_difficulty"]
          id?: string
          owner_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "words_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_list_words: { Args: { p_list_id: string }; Returns: boolean }
      can_add_to_list: { Args: { p_list_id: string }; Returns: boolean }
      can_delete_list_words: { Args: { p_list_id: string }; Returns: boolean }
      can_edit_list_words: { Args: { p_list_id: string }; Returns: boolean }
      can_view_list: { Args: { p_list_id: string }; Returns: boolean }
      get_list_preview_words: {
        Args: { p_list_ids: string[] }
        Returns: {
          difficulty: Database["public"]["Enums"]["word_difficulty"]
          list_id: string
          text: string
          word_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_list_owner: { Args: { p_list_id: string }; Returns: boolean }
      assign_shared_game_round_word: {
        Args: { p_game_id: string; p_team_id: string }
        Returns: boolean
      }
      edit_game_round_word_result: {
        Args: {
          p_game_id: string
          p_result: Database["public"]["Enums"]["word_result"]
          p_word_id: string
        }
        Returns: boolean
      }
      expire_current_game_round: { Args: { p_game_id: string }; Returns: string }
      next_game_round: { Args: { p_game_id: string }; Returns: boolean }
      recalculate_game_round_scores: { Args: { p_game_id: string }; Returns: undefined }
      resolve_current_game_round_word: {
        Args: {
          p_game_id: string
          p_result: Database["public"]["Enums"]["word_result"]
        }
        Returns: string
      }
      set_game_round_paused: {
        Args: { p_game_id: string; p_paused: boolean }
        Returns: boolean
      }
      start_prepared_game_round: { Args: { p_game_id: string }; Returns: boolean }
      start_game_round: { Args: { p_game_id: string }; Returns: string }
    }
    Enums: {
      game_status: "active" | "finished" | "cancelled"
      round_status: "preparation" | "active" | "result" | "finished"
      user_role: "user" | "admin"
      word_difficulty: "easy" | "medium" | "hard" | "insane"
      word_result: "guessed" | "skipped" | "last_word"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      game_status: ["active", "finished", "cancelled"],
      round_status: ["preparation", "active", "result", "finished"],
      user_role: ["user", "admin"],
      word_difficulty: ["easy", "medium", "hard", "insane"],
      word_result: ["guessed", "skipped", "last_word"],
    },
  },
} as const
