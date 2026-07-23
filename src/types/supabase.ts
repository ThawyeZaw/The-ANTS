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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_urls: string[] | null
          content: string | null
          feedback: string | null
          grade: number | null
          graded_at: string | null
          id: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          attachment_urls?: string[] | null
          content?: string | null
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          attachment_urls?: string[] | null
          content?: string | null
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_urls: string[] | null
          classroom_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          id: string
          priority: string
          status: string | null
          title: string
          total_points: number | null
          updated_at: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          classroom_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          status?: string | null
          title: string
          total_points?: number | null
          updated_at?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          status?: string | null
          title?: string
          total_points?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_reviews: {
        Row: {
          card_id: string
          ease_factor: number | null
          id: string
          interval: number | null
          last_review_date: string | null
          next_review_date: string | null
          quality: number | null
          repetitions: number | null
          user_id: string
        }
        Insert: {
          card_id: string
          ease_factor?: number | null
          id?: string
          interval?: number | null
          last_review_date?: string | null
          next_review_date?: string | null
          quality?: number | null
          repetitions?: number | null
          user_id: string
        }
        Update: {
          card_id?: string
          ease_factor?: number | null
          id?: string
          interval?: number | null
          last_review_date?: string | null
          next_review_date?: string | null
          quality?: number | null
          repetitions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          back_text: string | null
          created_at: string | null
          deck_id: string
          front_text: string | null
          id: string
        }
        Insert: {
          back_text?: string | null
          created_at?: string | null
          deck_id: string
          front_text?: string | null
          id?: string
        }
        Update: {
          back_text?: string | null
          created_at?: string | null
          deck_id?: string
          front_text?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          exam_board: string | null
          grade: string | null
          id: string
          is_hidden: boolean | null
          is_verified: boolean | null
          order_no: number | null
          subject: string | null
          type: string
          user_id: string
          verified_by: string | null
          year: number | null
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          exam_board?: string | null
          grade?: string | null
          id?: string
          is_hidden?: boolean | null
          is_verified?: boolean | null
          order_no?: number | null
          subject?: string | null
          type: string
          user_id: string
          verified_by?: string | null
          year?: number | null
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          exam_board?: string | null
          grade?: string | null
          id?: string
          is_hidden?: boolean | null
          is_verified?: boolean | null
          order_no?: number | null
          subject?: string | null
          type?: string
          user_id?: string
          verified_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_curriculums: {
        Row: {
          classroom_id: string
          curriculum_id: string
          id: string
        }
        Insert: {
          classroom_id: string
          curriculum_id: string
          id?: string
        }
        Update: {
          classroom_id?: string
          curriculum_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_curriculums_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_curriculums_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_members: {
        Row: {
          classroom_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_members_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_resources: {
        Row: {
          classroom_id: string
          created_at: string | null
          curriculum_id: string | null
          description: string | null
          id: string
          subject_id: string | null
          title: string
          type: string
          uploaded_by: string
          url: string
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          id?: string
          subject_id?: string | null
          title: string
          type: string
          uploaded_by: string
          url: string
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          type?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_resources_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_resources_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string | null
          created_by: string
          curriculum_ids: string[] | null
          description: string | null
          enabled_features: Json | null
          id: string
          invite_code: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          curriculum_ids?: string[] | null
          description?: string | null
          enabled_features?: Json | null
          id?: string
          invite_code?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          curriculum_ids?: string[] | null
          description?: string | null
          enabled_features?: Json | null
          id?: string
          invite_code?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_announcements: {
        Row: {
          club_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          title: string
        }
        Insert: {
          club_id: string
          content?: string
          created_at?: string | null
          created_by: string
          id?: string
          title: string
        }
        Update: {
          club_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_announcements_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_leaders: {
        Row: {
          club_id: string
          id: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_leaders_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_leaders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_projects: {
        Row: {
          club_id: string
          contributors: string[] | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          links: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          club_id: string
          contributors?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          links?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string
          contributors?: string[] | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          links?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_projects_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_sections: {
        Row: {
          club_id: string
          id: string
          order_no: number
          section_key: string
          title_override: string | null
          visible: boolean | null
        }
        Insert: {
          club_id: string
          id?: string
          order_no?: number
          section_key: string
          title_override?: string | null
          visible?: boolean | null
        }
        Update: {
          club_id?: string
          id?: string
          order_no?: number
          section_key?: string
          title_override?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "club_sections_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          accent_color: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          custom_slug: string | null
          description: string | null
          field: string
          id: string
          name: string
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          custom_slug?: string | null
          description?: string | null
          field?: string
          id?: string
          name: string
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          custom_slug?: string | null
          description?: string | null
          field?: string
          id?: string
          name?: string
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contributor_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          facebook_url: string | null
          github: string | null
          id: string
          linkedin: string | null
          published_curriculums_count: number | null
          published_notes_count: number | null
          qualifications: string[] | null
          specialisations: string[] | null
          title: string | null
          verification_documents_url: string | null
          website: string | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          facebook_url?: string | null
          github?: string | null
          id: string
          linkedin?: string | null
          published_curriculums_count?: number | null
          published_notes_count?: number | null
          qualifications?: string[] | null
          specialisations?: string[] | null
          title?: string | null
          verification_documents_url?: string | null
          website?: string | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          facebook_url?: string | null
          github?: string | null
          id?: string
          linkedin?: string | null
          published_curriculums_count?: number | null
          published_notes_count?: number | null
          qualifications?: string[] | null
          specialisations?: string[] | null
          title?: string | null
          verification_documents_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributor_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculums: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          exam_board: string | null
          grading_system: string | null
          hierarchy_model: Json | null
          id: string
          is_public: boolean | null
          library_status: string | null
          qualification: string | null
          share_token: string | null
          status: string | null
          structure_type: string | null
          subject_count: number | null
          syllabus_code: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_board?: string | null
          grading_system?: string | null
          hierarchy_model?: Json | null
          id?: string
          is_public?: boolean | null
          library_status?: string | null
          qualification?: string | null
          share_token?: string | null
          status?: string | null
          structure_type?: string | null
          subject_count?: number | null
          syllabus_code?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_board?: string | null
          grading_system?: string | null
          hierarchy_model?: Json | null
          id?: string
          is_public?: boolean | null
          library_status?: string | null
          qualification?: string | null
          share_token?: string | null
          status?: string | null
          structure_type?: string | null
          subject_count?: number | null
          syllabus_code?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          category: string | null
          created_at: string | null
          curriculum_id: string | null
          description: string | null
          exam_board: string | null
          id: string
          is_public: boolean | null
          name: string | null
          owner_id: string
          subject_id: string | null
          syllabus_code: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          exam_board?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          owner_id: string
          subject_id?: string | null
          syllabus_code?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          description?: string | null
          exam_board?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          owner_id?: string
          subject_id?: string | null
          syllabus_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decks_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "discussion_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_topics: {
        Row: {
          assignment_id: string | null
          classroom_id: string
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          classroom_id: string
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          classroom_id?: string
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_topics_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_topics_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_submissions: {
        Row: {
          contributor_id: string
          entity_id: string | null
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
          submission_type: string | null
          submitted_at: string | null
        }
        Insert: {
          contributor_id: string
          entity_id?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_type?: string | null
          submitted_at?: string | null
        }
        Update: {
          contributor_id?: string
          entity_id?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_type?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editor_submissions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editor_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_countdowns: {
        Row: {
          created_at: string | null
          custom_title: string | null
          exam_id: string | null
          id: string
          priority_indicator: string | null
          qualification_group: string | null
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_title?: string | null
          exam_id?: string | null
          id?: string
          priority_indicator?: string | null
          qualification_group?: string | null
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_title?: string | null
          exam_id?: string | null
          id?: string
          priority_indicator?: string | null
          qualification_group?: string | null
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_countdowns_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_countdowns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_schedules: {
        Row: {
          color_code: string | null
          created_at: string | null
          date: string
          description: string | null
          duration_minutes: number | null
          exam_board: string | null
          exam_id: string | null
          id: string
          is_custom: boolean | null
          paper_code: string | null
          priority: string | null
          series: string | null
          session: string | null
          start_time: string | null
          subject: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          duration_minutes?: number | null
          exam_board?: string | null
          exam_id?: string | null
          id?: string
          is_custom?: boolean | null
          paper_code?: string | null
          priority?: string | null
          series?: string | null
          session?: string | null
          start_time?: string | null
          subject?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number | null
          exam_board?: string | null
          exam_id?: string | null
          id?: string
          is_custom?: boolean | null
          paper_code?: string | null
          priority?: string | null
          series?: string | null
          session?: string | null
          start_time?: string | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string | null
          curriculum_id: string | null
          date: string
          duration: number | null
          exam_board: string | null
          id: string
          paper_code: string | null
          series: string | null
          session: string | null
          start_time: string | null
          subject: string
          subject_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          curriculum_id?: string | null
          date: string
          duration?: number | null
          exam_board?: string | null
          id?: string
          paper_code?: string | null
          series?: string | null
          session?: string | null
          start_time?: string | null
          subject: string
          subject_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          curriculum_id?: string | null
          date?: string
          duration?: number | null
          exam_board?: string | null
          id?: string
          paper_code?: string | null
          series?: string | null
          session?: string | null
          start_time?: string | null
          subject?: string
          subject_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_boundaries: {
        Row: {
          exam_id: string
          grade_a: number | null
          grade_b: number | null
          grade_c: number | null
          grade_d: number | null
          grade_e: number | null
          grade_f: number | null
          grade_g: number | null
          grade_u: number | null
          id: string
          raw_mark_max: number | null
          ums_max: number | null
        }
        Insert: {
          exam_id: string
          grade_a?: number | null
          grade_b?: number | null
          grade_c?: number | null
          grade_d?: number | null
          grade_e?: number | null
          grade_f?: number | null
          grade_g?: number | null
          grade_u?: number | null
          id?: string
          raw_mark_max?: number | null
          ums_max?: number | null
        }
        Update: {
          exam_id?: string
          grade_a?: number | null
          grade_b?: number | null
          grade_c?: number | null
          grade_d?: number | null
          grade_e?: number | null
          grade_f?: number | null
          grade_g?: number | null
          grade_u?: number | null
          id?: string
          raw_mark_max?: number | null
          ums_max?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_boundaries_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_entries: {
        Row: {
          component_name: string | null
          created_at: string | null
          exam_id: string | null
          id: string
          max_score: number | null
          predicted_grade: string | null
          raw_score: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          max_score?: number | null
          predicted_grade?: string | null
          raw_score?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          exam_id?: string | null
          id?: string
          max_score?: number | null
          predicted_grade?: string | null
          raw_score?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_entries_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          blocks: Json
          contributor_id: string
          created_at: string | null
          curriculum_id: string | null
          id: string
          is_syllabus_based: boolean | null
          reviewer_feedback: string | null
          reviewer_id: string | null
          status: string | null
          subject_id: string | null
          summary: string | null
          syllabus_point: string | null
          tags: string[] | null
          title: string
          topic_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          blocks?: Json
          contributor_id: string
          created_at?: string | null
          curriculum_id?: string | null
          id?: string
          is_syllabus_based?: boolean | null
          reviewer_feedback?: string | null
          reviewer_id?: string | null
          status?: string | null
          subject_id?: string | null
          summary?: string | null
          syllabus_point?: string | null
          tags?: string[] | null
          title: string
          topic_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          blocks?: Json
          contributor_id?: string
          created_at?: string | null
          curriculum_id?: string | null
          id?: string
          is_syllabus_based?: boolean | null
          reviewer_feedback?: string | null
          reviewer_id?: string | null
          status?: string | null
          subject_id?: string | null
          summary?: string | null
          syllabus_point?: string | null
          tags?: string[] | null
          title?: string
          topic_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          category: string | null
          completed_at: string | null
          duration_minutes: number | null
          id: string
          task_name: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          task_name?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          task_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievements: Json | null
          activities: Json | null
          avatar_url: string | null
          bio: string | null
          certification_ids: string[] | null
          created_at: string | null
          custom_url_slug: string | null
          email: string | null
          id: string
          is_public: boolean | null
          name: string | null
          pinned_item_id: string | null
          projects: Json | null
          role: Database["public"]["Enums"]["user_role"] | null
          section_layout: string | null
          section_order: Json | null
          section_visibility: Json | null
          show_club_activity: boolean | null
          show_club_memberships: boolean | null
          show_club_projects: boolean | null
          social_links: Json | null
          spacing: string | null
          theme: Json | null
          title: string | null
          updated_at: string | null
          username: string | null
          width: string | null
        }
        Insert: {
          achievements?: Json | null
          activities?: Json | null
          avatar_url?: string | null
          bio?: string | null
          certification_ids?: string[] | null
          created_at?: string | null
          custom_url_slug?: string | null
          email?: string | null
          id: string
          is_public?: boolean | null
          name?: string | null
          pinned_item_id?: string | null
          projects?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section_layout?: string | null
          section_order?: Json | null
          section_visibility?: Json | null
          show_club_activity?: boolean | null
          show_club_memberships?: boolean | null
          show_club_projects?: boolean | null
          social_links?: Json | null
          spacing?: string | null
          theme?: Json | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
          width?: string | null
        }
        Update: {
          achievements?: Json | null
          activities?: Json | null
          avatar_url?: string | null
          bio?: string | null
          certification_ids?: string[] | null
          created_at?: string | null
          custom_url_slug?: string | null
          email?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          pinned_item_id?: string | null
          projects?: Json | null
          role?: Database["public"]["Enums"]["user_role"] | null
          section_layout?: string | null
          section_order?: Json | null
          section_visibility?: Json | null
          show_club_activity?: boolean | null
          show_club_memberships?: boolean | null
          show_club_projects?: boolean | null
          social_links?: Json | null
          spacing?: string | null
          theme?: Json | null
          title?: string | null
          updated_at?: string | null
          username?: string | null
          width?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number | null
          started_at: string | null
          student_id: string
          submitted_at: string | null
          total_points: number
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string | null
          student_id: string
          submitted_at?: string | null
          total_points?: number
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          student_id?: string
          submitted_at?: string | null
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          classroom_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          questions: Json
          status: string
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          classroom_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          questions?: Json
          status?: string
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          classroom_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          questions?: Json
          status?: string
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          contributor_id: string | null
          created_at: string | null
          curriculum_id: string | null
          id: string
          is_public: boolean | null
          resource_type: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          contributor_id?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          id?: string
          is_public?: boolean | null
          resource_type?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          contributor_id?: string | null
          created_at?: string | null
          curriculum_id?: string | null
          id?: string
          is_public?: boolean | null
          resource_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          contributor_id: string
          entity_id: string
          feedback: Json | null
          id: string
          is_update: boolean | null
          published_entity_id: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
          submission_type: string
          submitted_at: string | null
          submitted_data: Json
        }
        Insert: {
          contributor_id: string
          entity_id: string
          feedback?: Json | null
          id?: string
          is_update?: boolean | null
          published_entity_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_type: string
          submitted_at?: string | null
          submitted_data: Json
        }
        Update: {
          contributor_id?: string
          entity_id?: string
          feedback?: Json | null
          id?: string
          is_update?: boolean | null
          published_entity_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_type?: string
          submitted_at?: string | null
          submitted_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_upgrade_requests: {
        Row: {
          created_at: string | null
          current_role: Database["public"]["Enums"]["user_role"]
          id: string
          reason: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_role: Database["public"]["Enums"]["user_role"]
          id?: string
          reason?: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          reason?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_upgrade_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_upgrade_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          id: string
          study_goals_metadata: Json | null
          target_exam_year: number | null
        }
        Insert: {
          id: string
          study_goals_metadata?: Json | null
          target_exam_year?: number | null
        }
        Update: {
          id?: string
          study_goals_metadata?: Json | null
          target_exam_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          curriculum_id: string
          description: string | null
          id: string
          order_no: number | null
          title: string
        }
        Insert: {
          curriculum_id: string
          description?: string | null
          id?: string
          order_no?: number | null
          title: string
        }
        Update: {
          curriculum_id?: string
          description?: string | null
          id?: string
          order_no?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          id: string
          institution_name: string | null
          is_verified_teacher: boolean | null
        }
        Insert: {
          id: string
          institution_name?: string | null
          is_verified_teacher?: boolean | null
        }
        Update: {
          id?: string
          institution_name?: string | null
          is_verified_teacher?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_events: {
        Row: {
          all_day: boolean | null
          color_code: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_source: string | null
          event_type: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          is_todo: boolean | null
          location: string | null
          metadata: Json | null
          recurrence_rule: Json | null
          source_id: string | null
          start_time: string | null
          subject: string | null
          title: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color_code?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_source?: string | null
          event_type?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          is_todo?: boolean | null
          location?: string | null
          metadata?: Json | null
          recurrence_rule?: Json | null
          source_id?: string | null
          start_time?: string | null
          subject?: string | null
          title: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color_code?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_source?: string | null
          event_type?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          is_todo?: boolean | null
          location?: string | null
          metadata?: Json | null
          recurrence_rule?: Json | null
          source_id?: string | null
          start_time?: string | null
          subject?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_progress: {
        Row: {
          confidence_level: number | null
          id: string
          status: string | null
          topic_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          id?: string
          status?: string | null
          topic_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          id?: string
          status?: string | null
          topic_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          description: string | null
          id: string
          order_no: number | null
          subject_id: string
          title: string
        }
        Insert: {
          description?: string | null
          id?: string
          order_no?: number | null
          subject_id: string
          title: string
        }
        Update: {
          description?: string | null
          id?: string
          order_no?: number | null
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_curriculums: {
        Row: {
          completed_at: string | null
          curriculum_id: string
          id: string
          started_at: string | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          curriculum_id: string
          id?: string
          started_at?: string | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          curriculum_id?: string
          id?: string
          started_at?: string | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculums_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculums_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_enrollments: {
        Row: {
          curriculum_id: string
          enrolled_at: string | null
          exam_id: string | null
          id: string
          subject_id: string
          user_id: string
        }
        Insert: {
          curriculum_id: string
          enrolled_at?: string | null
          exam_id?: string | null
          id?: string
          subject_id: string
          user_id: string
        }
        Update: {
          curriculum_id?: string
          enrolled_at?: string | null
          exam_id?: string | null
          id?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_enrollments_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exam_history: {
        Row: {
          curriculum_id: string
          exam_date: string
          exam_id: string | null
          id: string
          is_mock: boolean | null
          notes: string | null
          recorded_at: string | null
          result: string | null
          subject_id: string
          user_id: string
        }
        Insert: {
          curriculum_id: string
          exam_date: string
          exam_id?: string | null
          id?: string
          is_mock?: boolean | null
          notes?: string | null
          recorded_at?: string | null
          result?: string | null
          subject_id: string
          user_id: string
        }
        Update: {
          curriculum_id?: string
          exam_date?: string
          exam_id?: string | null
          id?: string
          is_mock?: boolean | null
          notes?: string | null
          recorded_at?: string | null
          result?: string | null
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_history_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exam_history_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exam_history_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exam_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_exam_overrides: {
        Row: {
          custom_exam_date: string | null
          custom_exam_series: string | null
          custom_title: string | null
          exam_id: string
          id: string
          user_id: string
        }
        Insert: {
          custom_exam_date?: string | null
          custom_exam_series?: string | null
          custom_title?: string | null
          exam_id: string
          id?: string
          user_id: string
        }
        Update: {
          custom_exam_date?: string | null
          custom_exam_series?: string | null
          custom_title?: string | null
          exam_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_exam_overrides_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_exam_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_notes: {
        Row: {
          id: string
          note_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          note_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          note_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      version_history: {
        Row: {
          changed_at: string | null
          changed_by: string
          changes: Json
          entity_id: string
          entity_type: string
          id: string
          review_item_id: string | null
          version_number: number
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          changes?: Json
          entity_id: string
          entity_type: string
          id?: string
          review_item_id?: string | null
          version_number: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          changes?: Json
          entity_id?: string
          entity_type?: string
          id?: string
          review_item_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "version_history_changed_by_fkey"
            columns: ["changed_by"]
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
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
    }
    Enums: {
      evaluation_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "revision_requested"
      user_role: "student" | "teacher" | "contributor" | "main_contributor"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      evaluation_status: [
        "draft",
        "pending_review",
        "approved",
        "revision_requested",
      ],
      user_role: ["student", "teacher", "contributor", "main_contributor"],
    },
  },
} as const
