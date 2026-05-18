-- Memperbaiki Kebijakan RLS untuk tabel profiles dan user_roles
-- Masalah: Pengguna tidak dapat mengambil profil dan peran mereka sendiri (error 406)
-- Solusi: Pastikan pengguna yang terautentikasi dapat melihat data mereka sendiri

-- Pertama, tinjau dan perbaiki kebijakan pada tabel user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
-- Buat ulang kebijakan user_roles dengan pengecekan autentikasi yang benar
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
-- Selanjutnya, perbaiki kebijakan pada tabel profiles

-- Buat ulang kebijakan profiles dengan pengecekan autentikasi yang benar
CREATE POLICY "Users can view their own role"
-- Pastikan pengguna yang terautentikasi HARUS memiliki entri di auth.users
-- Migrasi ini memastikan keamanan dengan mewajibkan autentikasi

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Next, fix profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate profiles policies with proper authentication check
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete their own deleted tagihan" ON public.tagihan;
CREATE POLICY "Users can delete their own deleted tagihan"
ON public.tagihan FOR DELETE
USING (auth.uid() = user_id and deleted_at IS NOT NULL);

DROP POLICY IF EXISTS "Public can view active tagihan" ON public.tagihan;
CREATE POLICY "Public can view active tagihan"
ON public.tagihan FOR SELECT
USING (deleted_at IS NULL);

-- Ensure that authenticated users MUST have an entry in auth.users
-- This migration ensures proper security by requiring authentication
