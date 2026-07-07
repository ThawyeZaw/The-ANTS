-- ============================================================================
-- The ANTS — Migration: Fix Auth Hooks
-- Fixes custom_access_token_hook failing on null claims and sets permissions
-- Fixes handle_new_user enum casting
-- ============================================================================

-- Fix custom_access_token_hook to handle null claims correctly
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
    claims jsonb;
    user_role_val text;
BEGIN
    -- Safely handle null claims. If event->'claims' is null, COALESCE falls back to '{}'
    claims := COALESCE(event->'claims', '{}'::jsonb);
    
    -- Try to fetch user role from profiles
    SELECT role::text INTO user_role_val 
    FROM public.profiles 
    WHERE id = (event->>'user_id')::uuid;
    
    -- Default to student if not found
    claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role_val, 'student')));
    
    -- Return modified event
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Ensure execute permissions are set correctly for GoTrue hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- Fix handle_new_user to ensure it safely casts the role to the enum type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create base profile safely
  INSERT INTO public.profiles (id, email, name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'student'::user_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default student_profiles row
  INSERT INTO public.student_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
