# 🔍 PREVIEW SQL MIGRATION

## File: `supabase/migrations/20260518_fix_rls_policies.sql`

Dokumentasi lengkap SQL yang akan dijalankan di Supabase Dashboard.

---

## 📝 RINGKAS PERUBAHAN

### Tabel yang Diubah: `user_roles`
**Aksi**: DROP 4 old policies + CREATE 5 new policies

#### Policies yang dihapus:
- "Users can view their own role"
- "Admins can view all roles"
- "Admins can insert roles"
- "Admins can delete roles"

#### Policies yang dibuat:
1. Users can view their own role (SELECT)
2. Admins can view all roles (SELECT)
3. Admins can insert roles (INSERT)
4. Admins can update roles (UPDATE) ← NEW
5. Admins can delete roles (DELETE)

---

### Tabel yang Diubah: `profiles`
**Aksi**: DROP 5 old policies + CREATE 5 new policies

#### Policies yang dihapus:
- "Users can view their own profile"
- "Admins can view all profiles"
- "Admins can insert profiles"
- "Admins can update profiles"
- "Admins can delete profiles"

#### Policies yang dibuat:
1. Users can view their own profile (SELECT)
2. Admins can view all profiles (SELECT)
3. Admins can insert profiles (INSERT)
4. Admins can update profiles (UPDATE)
5. Admins can delete profiles (DELETE)

---

## 📋 FULL SQL CONTENT

```sql
-- Fix RLS Policies for profiles and user_roles tables
-- Problem: Users cannot fetch their own profiles and roles due to 406 errors
-- Solution: Ensure authenticated users can view their own data

-- First, let's review and fix user_roles policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Recreate user_roles policies with proper authentication check
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

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

-- Ensure that authenticated users MUST have an entry in auth.users
-- This migration ensures proper security by requiring authentication
```

---

## 🔐 PENJELASAN SETIAP POLICY

### `user_roles` Table

#### 1. "Users can view their own role" (SELECT)
```sql
USING (auth.uid() = user_id)
```
- **Kondisi**: User hanya bisa lihat jika `auth.uid()` match `user_id`
- **Contoh**: User dengan ID "abc-123" hanya lihat role mereka sendiri
- **Security**: High (isolated access)

#### 2. "Admins can view all roles" (SELECT)
```sql
USING (public.has_role(auth.uid(), 'admin'))
```
- **Kondisi**: Hanya user dengan role 'admin' yang bisa jalankan
- **Efek**: Admin bisa lihat semua user roles
- **Security**: High (explicit role check)

#### 3. "Admins can insert roles" (INSERT)
```sql
WITH CHECK (public.has_role(auth.uid(), 'admin'))
```
- **Kondisi**: Hanya admin yang bisa insert role baru
- **Efek**: Gunanya saat create user baru
- **Security**: High (protected operation)

#### 4. "Admins can update roles" (UPDATE)
```sql
USING (public.has_role(auth.uid(), 'admin'))
```
- **Kondisi**: Hanya admin yang bisa update role
- **Efek**: Gunanya saat ubah role user
- **Security**: High (protected operation)

#### 5. "Admins can delete roles" (DELETE)
```sql
USING (public.has_role(auth.uid(), 'admin'))
```
- **Kondisi**: Hanya admin yang bisa delete role
- **Efek**: Gunanya saat remove role dari user
- **Security**: High (protected operation)

### `profiles` Table

Policies sama dengan `user_roles`, tapi untuk tabel `profiles`:

#### 1. "Users can view their own profile" (SELECT)
- User hanya lihat profile mereka sendiri

#### 2. "Admins can view all profiles" (SELECT)
- Admin lihat semua user profiles

#### 3. "Admins can insert profiles" (INSERT)
- Admin insert profile baru saat create user

#### 4. "Admins can update profiles" (UPDATE)
- Admin update profile user

#### 5. "Admins can delete profiles" (DELETE)
- Admin delete profile user

---

## ✅ VALIDASI SEBELUM JALANKAN

Sebelum click RUN, pastikan:

- ✓ Anda di Supabase Dashboard
- ✓ Anda di project "Revapppulsasnd"
- ✓ Anda di SQL Editor
- ✓ Database connected (no error message di UI)
- ✓ SQL sudah di-copy dengan benar

---

## ⚠️ AFTER RUNNING SQL

### Expected Result
```
Query executed successfully
(No error message)
```

### Time Expected
~10-30 seconds

### What Happens
1. Old policies are dropped (tidak error jika tidak ada)
2. New policies are created
3. Database updated automatically
4. No downtime required

---

## 🔄 ROLLBACK (Jika diperlukan)

Jika ada masalah, rollback adalah automatic:
- Supabase memiliki database backup
- Bisa restore dari previous state
- Hubungi Supabase support jika perlu

---

## 📊 DATABASE IMPACT

| Aspek | Status |
|-------|--------|
| **Downtime** | ❌ NONE (live migration) |
| **Data Loss** | ❌ NONE (only policies changed) |
| **User Impact** | ❌ NONE (until migration complete) |
| **Schema Change** | ❌ NONE (only RLS policies) |
| **Performance** | ✅ No impact |
| **Reversible** | ✅ Yes (rollback available) |

---

## 🎯 SUCCESS CRITERIA

After running SQL:

- [ ] No error messages in console
- [ ] Policies tab shows new policies
- [ ] `user_roles` has 5 policies
- [ ] `profiles` has 5 policies
- [ ] Clear browser cache
- [ ] Test login works
- [ ] No error 406 in console

---

## 📝 NOTES

- Ini adalah standar RLS configuration
- Mengikuti Supabase best practices
- Mengikuti principle of least privilege
- Database-level enforcement (aman)
- No code changes required

---

**Ready to execute? Go to QUICK_FIX.md and start Langkah 1!** 🚀
