-- ============================================================================
-- The ANTS — Migration: Fix Auth Hooks JSON Null
-- Fixes custom_access_token_hook failing on 'null'::jsonb claims
-- ============================================================================

-- Fix custom_access_token_hook to handle JSON null claims correctly
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
    claims jsonb;
    user_role_val text;
BEGIN
    -- Safely handle JSON null and SQL null claims
    IF event->'claims' IS NULL OR jsonb_typeof(event->'claims') = 'null' THEN
        claims := '{}'::jsonb;
    ELSE
        claims := event->'claims';
    END IF;
    
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
