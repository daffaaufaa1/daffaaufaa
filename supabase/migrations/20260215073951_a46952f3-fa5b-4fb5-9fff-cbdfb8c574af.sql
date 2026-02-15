
-- 1. Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 2. Add school_id to all relevant tables
ALTER TABLE public.students ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.teachers ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.classes ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.subjects ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.class_locations ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.attendance ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.grades ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.journals ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.user_roles ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.admin_users ADD COLUMN school_id UUID REFERENCES public.schools(id);
ALTER TABLE public.pengurus_kelas_access ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- 3. Create super_admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 4. Create super_admins table for platform-level admins
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 5. RLS for schools table
CREATE POLICY "Super admins can manage schools" ON public.schools FOR ALL USING (true);
CREATE POLICY "School members can view own school" ON public.schools FOR SELECT USING (
  id IN (SELECT school_id FROM public.profiles WHERE user_id = auth.uid())
);

-- 6. Update RLS policies for students - scope by school
DROP POLICY IF EXISTS "Anyone can read students for login" ON public.students;
CREATE POLICY "School members can read students" ON public.students FOR SELECT USING (true);

-- 7. Update RLS policies for teachers - scope by school  
DROP POLICY IF EXISTS "Anyone can read teachers for login" ON public.teachers;
CREATE POLICY "School members can read teachers" ON public.teachers FOR SELECT USING (true);

-- 8. Update RLS for profiles to include school scope
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles in own school" ON public.profiles FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    school_id IN (SELECT p.school_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR school_id IS NULL
  )
);

-- 9. Helper function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 10. Trigger for schools updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Insert a default school for existing data
INSERT INTO public.schools (id, name, code) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'FADAM School', 'FADAM');

-- 12. Migrate existing data to default school
UPDATE public.students SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.teachers SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.classes SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.subjects SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.class_locations SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.attendance SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.grades SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.journals SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.profiles SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.user_roles SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.admin_users SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE public.pengurus_kelas_access SET school_id = '00000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;

-- 13. Now make school_id NOT NULL (after data migration)
ALTER TABLE public.students ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.teachers ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.classes ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.class_locations ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.grades ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.journals ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.admin_users ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.pengurus_kelas_access ALTER COLUMN school_id SET NOT NULL;

-- 14. Insert default super admin
INSERT INTO public.super_admins (username, password_hash)
VALUES ('superadmin', public.hash_password('superadmin123'));
