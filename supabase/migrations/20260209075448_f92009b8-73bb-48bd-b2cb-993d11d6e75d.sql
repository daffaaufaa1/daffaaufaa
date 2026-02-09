-- Buat function untuk mengecek apakah user adalah admin (berdasarkan session)
CREATE OR REPLACE FUNCTION public.is_admin_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id TEXT;
BEGIN
  -- Cek dari JWT claims custom (akan di-set saat login admin)
  admin_id := current_setting('request.jwt.claims', true)::json->>'admin_id';
  RETURN admin_id IS NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Drop existing policies yang terlalu permissive
DROP POLICY IF EXISTS "Admin can insert students" ON public.students;
DROP POLICY IF EXISTS "Admin can update students" ON public.students;
DROP POLICY IF EXISTS "Admin can delete students" ON public.students;
DROP POLICY IF EXISTS "Admin can insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admin can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admin can delete teachers" ON public.teachers;

-- Untuk sistem ini, admin CRUD akan dilakukan via Edge Function dengan service_role
-- Jadi kita buat policies yang memblok direct insert/update/delete dari client biasa
-- Hanya Edge Function dengan service_role yang bisa bypass RLS

-- Students: Blok direct modification dari anon/authenticated
CREATE POLICY "Block direct insert students" 
  ON public.students FOR INSERT 
  WITH CHECK (false);

CREATE POLICY "Block direct update students" 
  ON public.students FOR UPDATE 
  USING (false);

CREATE POLICY "Block direct delete students" 
  ON public.students FOR DELETE 
  USING (false);

-- Teachers: Blok direct modification dari anon/authenticated  
CREATE POLICY "Block direct insert teachers" 
  ON public.teachers FOR INSERT 
  WITH CHECK (false);

CREATE POLICY "Block direct update teachers" 
  ON public.teachers FOR UPDATE 
  USING (false);

CREATE POLICY "Block direct delete teachers" 
  ON public.teachers FOR DELETE 
  USING (false);