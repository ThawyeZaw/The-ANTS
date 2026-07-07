-- ============================================================================
-- The ANTS — Migration 11: Auth Hooks & Realtime
-- Auth hooks (handle_new_user, custom_access_token) and realtime publication.
-- ============================================================================

-- 1. AUTH HOOKS

-- 1.1 handle_new_user: auto-creates a profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
BEGIN
    INSERT INTO public.profiles (id, email, name, username, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_app_meta_data ->> 'user_role', 'student')::user_role
    );
    RETURN NEW;
END;
$;

-- 1.2 custom_access_token_hook: embeds user_role into JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
DECLARE
    claims jsonb;
    user_role_val text;
BEGIN
    claims := event->'claims';
    SELECT role::text INTO user_role_val FROM public.profiles WHERE id = (event->>'user_id')::uuid;
    claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role_val, 'student')));
    RETURN jsonb_set(event, '{claims}', claims);
END;
$;

-- 1.3 on_auth_user_created trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. REALTIME PUBLICATION

-- Add tables to the supabase_realtime publication for live features
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'club_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'quizzes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'discussion_topics'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_topics;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'discussion_replies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_replies;
    END IF;
END $$;
