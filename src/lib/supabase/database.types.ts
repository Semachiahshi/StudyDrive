
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_tasks": {
                  Row: {
                    "archived_at": string | null,"completed_at": string | null,"created_at": string,"due_on": string | null,"id": string,"notes": string | null,"reminders_enabled": boolean,"subject_id": string | null,"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"completed_at"?: string | null,"created_at"?: string,"due_on"?: string | null,"id"?: string,"notes"?: string | null,"reminders_enabled"?: boolean,"subject_id"?: string | null,"title": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"completed_at"?: string | null,"created_at"?: string,"due_on"?: string | null,"id"?: string,"notes"?: string | null,"reminders_enabled"?: boolean,"subject_id"?: string | null,"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_tasks_subject_id_user_id_fkey"
      columns: ["subject_id","user_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"exam_tracks": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"exam_date_status": Database["public"]['Enums']["exam_date_status"],"exam_ends_on": string | null,"exam_starts_on": string | null,"id": string,"kind": Database["public"]['Enums']["track_kind"],"name": string,"notes": string | null,"position": number,"subject_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"exam_date_status"?: Database["public"]['Enums']["exam_date_status"],"exam_ends_on"?: string | null,"exam_starts_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["track_kind"],"name": string,"notes"?: string | null,"position"?: number,"subject_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"exam_date_status"?: Database["public"]['Enums']["exam_date_status"],"exam_ends_on"?: string | null,"exam_starts_on"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["track_kind"],"name"?: string,"notes"?: string | null,"position"?: number,"subject_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exam_tracks_subject_id_user_id_fkey"
      columns: ["subject_id","user_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"subject_id": string | null,"title": string,"topic_id": string | null,"track_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"id"?: string,"subject_id"?: string | null,"title": string,"topic_id"?: string | null,"track_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"subject_id"?: string | null,"title"?: string,"topic_id"?: string | null,"track_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_subject_id_user_id_fkey"
      columns: ["subject_id","user_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "notes_topic_id_user_id_fkey"
      columns: ["topic_id","user_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "notes_track_id_user_id_fkey"
      columns: ["track_id","user_id"]
isOneToOne: false
      referencedRelation: "exam_tracks"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "buffer_days": number,"created_at": string,"display_name": string | null,"id": string,"plan_started_on": string | null,"study_days_per_week": number,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "buffer_days"?: number,"created_at"?: string,"display_name"?: string | null,"id": string,"plan_started_on"?: string | null,"study_days_per_week"?: number,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "buffer_days"?: number,"created_at"?: string,"display_name"?: string | null,"id"?: string,"plan_started_on"?: string | null,"study_days_per_week"?: number,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reminder_log": {
                  Row: {
                    "dedupe_key": string,"id": string,"sent_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dedupe_key": string,"id"?: string,"sent_at"?: string,"user_id": string
                  }
                  Update: {
                    "dedupe_key"?: string,"id"?: string,"sent_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reminder_preferences": {
                  Row: {
                    "deadline_lead_days": (number)[],"deadline_reminders_enabled": boolean,"email_enabled": boolean,"study_reminder_enabled": boolean,"study_reminder_weekdays": (number)[],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deadline_lead_days"?: (number)[],"deadline_reminders_enabled"?: boolean,"email_enabled"?: boolean,"study_reminder_enabled"?: boolean,"study_reminder_weekdays"?: (number)[],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "deadline_lead_days"?: (number)[],"deadline_reminders_enabled"?: boolean,"email_enabled"?: boolean,"study_reminder_enabled"?: boolean,"study_reminder_weekdays"?: (number)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"step_completions": {
                  Row: {
                    "completed_at": string,"id": string,"local_date": string,"step": Database["public"]['Enums']["topic_step"],"topic_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"id"?: string,"local_date": string,"step": Database["public"]['Enums']["topic_step"],"topic_id"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "completed_at"?: string,"id"?: string,"local_date"?: string,"step"?: Database["public"]['Enums']["topic_step"],"topic_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "step_completions_topic_id_user_id_fkey"
      columns: ["topic_id","user_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"study_files": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"mime_type": string | null,"size_bytes": number,"storage_path": string,"subject_id": string | null,"topic_id": string | null,"track_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number,"storage_path": string,"subject_id"?: string | null,"topic_id"?: string | null,"track_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number,"storage_path"?: string,"subject_id"?: string | null,"topic_id"?: string | null,"track_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "study_files_subject_id_user_id_fkey"
      columns: ["subject_id","user_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "study_files_topic_id_user_id_fkey"
      columns: ["topic_id","user_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "study_files_track_id_user_id_fkey"
      columns: ["track_id","user_id"]
isOneToOne: false
      referencedRelation: "exam_tracks"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"study_sessions": {
                  Row: {
                    "ended_at": string | null,"id": string,"local_date": string,"started_at": string,"step": Database["public"]['Enums']["topic_step"] | null,"topic_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ended_at"?: string | null,"id"?: string,"local_date": string,"started_at"?: string,"step"?: Database["public"]['Enums']["topic_step"] | null,"topic_id"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "ended_at"?: string | null,"id"?: string,"local_date"?: string,"started_at"?: string,"step"?: Database["public"]['Enums']["topic_step"] | null,"topic_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "study_sessions_topic_id_user_id_fkey"
      columns: ["topic_id","user_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"subjects": {
                  Row: {
                    "archived_at": string | null,"code": string | null,"created_at": string,"id": string,"name": string,"notes": string | null,"position": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"code"?: string | null,"created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"position"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"code"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"position"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"topics": {
                  Row: {
                    "archived_at": string | null,"completed_steps": number | null,"created_at": string,"id": string,"learn_completed_at": string | null,"notes": string | null,"position": number,"practice_completed_at": string | null,"review_completed_at": string | null,"title": string,"track_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"completed_steps"?: never,"created_at"?: string,"id"?: string,"learn_completed_at"?: string | null,"notes"?: string | null,"position"?: number,"practice_completed_at"?: string | null,"review_completed_at"?: string | null,"title": string,"track_id": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"completed_steps"?: never,"created_at"?: string,"id"?: string,"learn_completed_at"?: string | null,"notes"?: string | null,"position"?: number,"practice_completed_at"?: string | null,"review_completed_at"?: string | null,"title"?: string,"track_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "topics_track_id_user_id_fkey"
      columns: ["track_id","user_id"]
isOneToOne: false
      referencedRelation: "exam_tracks"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            "study_days": {
                  Row: {
                    "local_date": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "complete_topic_step":
{ Args: { "p_step": Database["public"]['Enums']["topic_step"],"p_topic_id": string }; Returns: {
              "archived_at": string | null,
"completed_steps": number | null,
"created_at": string,
"id": string,
"learn_completed_at": string | null,
"notes": string | null,
"position": number,
"practice_completed_at": string | null,
"review_completed_at": string | null,
"title": string,
"track_id": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "topics"
        isOneToOne: true
        isSetofReturn: false
      } },
"end_study_session":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"reopen_topic_step":
{ Args: { "p_step": Database["public"]['Enums']["topic_step"],"p_topic_id": string }; Returns: {
              "archived_at": string | null,
"completed_steps": number | null,
"created_at": string,
"id": string,
"learn_completed_at": string | null,
"notes": string | null,
"position": number,
"practice_completed_at": string | null,
"review_completed_at": string | null,
"title": string,
"track_id": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "topics"
        isOneToOne: true
        isSetofReturn: false
      } },
"start_study_session":
{ Args: { "p_step"?: Database["public"]['Enums']["topic_step"],"p_topic_id"?: string }; Returns: {
              "ended_at": string | null,
"id": string,
"local_date": string,
"started_at": string,
"step": Database["public"]['Enums']["topic_step"] | null,
"topic_id": string | null,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "study_sessions"
        isOneToOne: true
        isSetofReturn: false
      } },
"user_local_date":
{ Args: { "p_at": string,"p_user": string }; Returns: string
                           }
          }
          Enums: {
            "exam_date_status": "provisional"|"confirmed","topic_step": "learn"|"practice"|"review","track_kind": "didactic_test"|"essay"|"oral"|"practical"|"other"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "exam_date_status": ["provisional", "confirmed"],"topic_step": ["learn", "practice", "review"],"track_kind": ["didactic_test", "essay", "oral", "practical", "other"]
          }
        }
} as const
