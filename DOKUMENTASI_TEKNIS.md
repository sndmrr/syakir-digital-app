# DOKUMENTASI TEKNIS - PERBAIKAN ERROR 406 SUPABASE

## Ringkasan Eksekutif

**Problem**: Aplikasi stuck di loading loop saat login dengan error 406 pada query `profiles` dan `user_roles`
**Root Cause**: RLS (Row Level Security) policies tidak mengizinkan authenticated users mengakses data mereka
**Solution**: Perbaiki RLS policies di tabel `profiles` dan `user_roles`
**Time to Fix**: ~2 menit (setelah jalankan SQL)

---

## Analisis Masalah

### Error Message yang Diterima
```
Failed to load resource: the server responded with a status of 406
profiles?select=*&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce:1
user_roles?select=role&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce:1
```

### HTTP 406 Error
- **Status Code**: 406 Not Acceptable
- **Meaning**: Request violates database Row Level Security policies
- **Cause**: Query doesn't match ANY of the allowed RLS policies

### Urutan Event Saat Login
1. User input username + password
2. `useAuth.tsx` - `signIn()` call Supabase auth
3. `useAuth.tsx` - Auth success, `user` state updated
4. `useUserRole.tsx` - Hook triggered (because `user` state changed)
5. ❌ **ERROR**: Query `profiles` dengan filter `user_id=eq.{uuid}`
6. ❌ **ERROR**: Query `user_roles` dengan filter `user_id=eq.{uuid}`
7. ❌ Result: Loading loop infinite karena fetch gagal

### Mengapa Error 406?

**Sebelumnya** (Asumsi perubahan yang dilakukan):
```sql
-- Kemungkinan RLS policies diubah atau dihapus
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
-- Tanpa membuat policy baru yang valid
```

**Akibat**:
- Query tidak match dengan APAPUN policy yang ada
- Database return 406 (Not Acceptable)
- Infinite retry loop di React component

---

## Solusi Teknis

### RLS Policy Architecture yang Benar

#### Tabel: `public.user_roles`

**Schema**:
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,  -- 'admin' atau 'mitra'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);
```

**RLS Policies yang Benar**:

1. **SELECT Policy - Own Role**
   ```sql
   CREATE POLICY "Users can view their own role"
   ON public.user_roles FOR SELECT
   USING (auth.uid() = user_id);
   ```
   - Kondisi: `auth.uid()` HARUS match dengan `user_id` di row
   - Result: User hanya bisa lihat role mereka sendiri
   - Example: User dengan ID `221add75-...` hanya bisa lihat role mereka

2. **SELECT Policy - Admin Access**
   ```sql
   CREATE POLICY "Admins can view all roles"
   ON public.user_roles FOR SELECT
   USING (public.has_role(auth.uid(), 'admin'));
   ```
   - Kondisi: User HARUS memiliki role 'admin'
   - Result: Admin bisa lihat semua roles
   - Security: `has_role()` function verify user is admin

3. **INSERT Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can insert roles"
   ON public.user_roles FOR INSERT
   WITH CHECK (public.has_role(auth.uid(), 'admin'));
   ```
   - Kondisi: User HARUS admin untuk insert
   - Usage: Admin create user role

4. **UPDATE Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can update roles"
   ON public.user_roles FOR UPDATE
   USING (public.has_role(auth.uid(), 'admin'));
   ```
   - Kondisi: User HARUS admin untuk update
   - Usage: Admin modify user role

5. **DELETE Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can delete roles"
   ON public.user_roles FOR DELETE
   USING (public.has_role(auth.uid(), 'admin'));
   ```
   - Kondisi: User HARUS admin untuk delete
   - Usage: Admin delete user role

#### Tabel: `public.profiles`

**Schema**:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  tanggal_setor text DEFAULT NULL  -- Added for deposit date
);
```

**RLS Policies yang Benar**:

1. **SELECT Policy - Own Profile**
   ```sql
   CREATE POLICY "Users can view their own profile"
   ON public.profiles FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **SELECT Policy - Admin Access**
   ```sql
   CREATE POLICY "Admins can view all profiles"
   ON public.profiles FOR SELECT
   USING (public.has_role(auth.uid(), 'admin'));
   ```

3. **INSERT Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can insert profiles"
   ON public.profiles FOR INSERT
   WITH CHECK (public.has_role(auth.uid(), 'admin'));
   ```

4. **UPDATE Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can update profiles"
   ON public.profiles FOR UPDATE
   USING (public.has_role(auth.uid(), 'admin'));
   ```

5. **DELETE Policy - Admin Only**
   ```sql
   CREATE POLICY "Admins can delete profiles"
   ON public.profiles FOR DELETE
   USING (public.has_role(auth.uid(), 'admin'));
   ```

---

## Code Flow - Sebelum dan Sesudah Perbaikan

### SEBELUM (Error 406 - Infinite Loop)

```
1. User: "admin@syakirdigital.local" / "password123"
   ↓
2. signIn() → Supabase Auth Success
   - auth.uid() = "221add75-bf5b-4889-95e3-63baef64d1ce"
   ↓
3. useUserRole Hook triggered
   ↓
4. Query: SELECT role FROM user_roles 
         WHERE user_id = "221add75-bf5b-4889-95e3-63baef64d1ce"
   ❌ ERROR 406 (RLS Policy tidak allow this query)
   ↓
5. Component: setLoading(false) with error
   ↓
6. useEffect retry (infinite loop)
   ↓
7. User stuck di Loading Screen
```

### SESUDAH (Normal - Berhasil Login)

```
1. User: "admin@syakirdigital.local" / "password123"
   ↓
2. signIn() → Supabase Auth Success
   - auth.uid() = "221add75-bf5b-4889-95e3-63baef64d1ce"
   ↓
3. useUserRole Hook triggered
   ↓
4. Query: SELECT role FROM user_roles 
         WHERE user_id = "221add75-bf5b-4889-95e3-63baef64d1ce"
   ✓ POLICY MATCH: "Users can view their own role"
   ✓ Condition: auth.uid() = user_id ✓
   ✓ Query Success → role = 'admin'
   ↓
5. Query: SELECT * FROM profiles
         WHERE user_id = "221add75-bf5b-4889-95e3-63baef64d1ce"
   ✓ POLICY MATCH: "Users can view their own profile"
   ✓ Condition: auth.uid() = user_id ✓
   ✓ Query Success → profile data loaded
   ↓
6. Component: setLoading(false) with data
   ↓
7. useUserRole returns: { role: 'admin', profile: {...}, loading: false }
   ↓
8. Index.tsx check: role === 'admin' → show AdminDashboard ✓
```

---

## Security Analysis

### Policy Logic

**Kondisi untuk SELECT**:
```sql
USING (auth.uid() = user_id)
-- Translates to:
-- WHERE auth.uid() = user_roles.user_id
-- 
-- Only rows where authenticated user ID matches user_id column
-- will be returned to that user
```

**Contoh**:
```
User A (ID: 111) → SELECT * FROM user_roles WHERE user_id = 111 → ✓ Can see
User A (ID: 111) → SELECT * FROM user_roles WHERE user_id = 222 → ❌ Can't see
Admin (ID: 333 with admin role) → SELECT * FROM user_roles → ✓ Can see all
```

### Security Features

✅ **Least Privilege**
- Setiap user hanya bisa lihat data mereka sendiri
- Admin explicitly allowed via `has_role()` check

✅ **Database-Level Enforcement**
- RLS policies enforced di database, bukan di code
- Tidak bisa di-bypass dari application
- Lebih aman daripada application-level checks

✅ **Authentication Required**
- `auth.uid()` hanya return value jika user authenticated
- Unauthenticated requests get NULL → no rows returned

✅ **Audit Trail**
- Semua queries terlogge di Supabase logs
- Admin bisa lihat siapa akses apa kapan

---

## Frontend Code Review

### ✓ `useAuth.tsx` - CORRECT

```typescript
const signIn = async (email: string, password: string, nama: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error) {
    setUserName(nama);
    localStorage.setItem('userName', nama);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
  return { error };
};
```

**Analysis**:
- ✓ Uses `supabase.auth.signInWithPassword()` - Standard Supabase method
- ✓ Returns error if login fails
- ✓ No bypass authentication
- ✓ Stores user version for cache invalidation

### ✓ `useUserRole.tsx` - CORRECT

```typescript
useEffect(() => {
  const fetchUserRoleAndProfile = async () => {
    if (!user) {
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;  // ✓ Check auth first
    }

    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)  // ✓ Uses authenticated user.id
        .single();

      if (roleError) {
        console.error('Error fetching role:', roleError);
        setRole(null);
      } else {
        setRole(roleData?.role);
      }
      // Similar for profiles...
    }
  };
  
  fetchUserRoleAndProfile();
}, [user]);  // ✓ Dependency on user
```

**Analysis**:
- ✓ Checks `if (!user)` before attempting queries
- ✓ Uses `user.id` (authenticated user ID)
- ✓ Proper error handling
- ✓ Re-runs when user state changes
- ✓ No unauthenticated access

---

## Database Verification Queries

### Check User Exists in All Tables

```sql
-- Check if user 221add75-bf5b-4889-95e3-63baef64d1ce exists everywhere
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users 
WHERE id = '221add75-bf5b-4889-95e3-63baef64d1ce'

UNION ALL

SELECT 'profiles', COUNT(*) 
FROM profiles 
WHERE user_id = '221add75-bf5b-4889-95e3-63baef64d1ce'

UNION ALL

SELECT 'user_roles', COUNT(*) 
FROM user_roles 
WHERE user_id = '221add75-bf5b-4889-95e3-63baef64d1ce';
```

**Expected Result**:
```
table_name  | count
------------|------
auth.users  | 1
profiles    | 1
user_roles  | 1
```

### Check RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies 
WHERE tablename IN ('user_roles', 'profiles')
ORDER BY tablename, policyname;
```

**Expected Output**: Should show all policies created by migration

---

## Testing Procedure

### Unit Test: RLS Policy Query

```sql
-- Switch to test user context
-- Simulate: User with ID 'TEST-USER-ID-123' (only has their own role)

-- This should work (matches "Users can view their own role")
SELECT * FROM user_roles 
WHERE user_id = 'TEST-USER-ID-123';
-- Expected: 1 row with TEST-USER-ID-123

-- This should fail (violates RLS)
SELECT * FROM user_roles 
WHERE user_id = 'OTHER-USER-ID-456';
-- Expected: 0 rows (RLS hides it)

-- This works for admin (matches "Admins can view all roles")
-- (requires user to have 'admin' role)
SELECT * FROM user_roles;
-- Expected: All rows (if user is admin)
```

---

## Implementation Checklist

- [x] Analyze problem
- [x] Create migration file: `20260518_fix_rls_policies.sql`
- [x] Review RLS policy logic
- [x] Verify frontend code (no auth bypass)
- [x] Create instructions: `INSTRUKSI_PERBAIKI_SUPABASE.md`
- [x] Create verification checklist: `CHECKLIST_PERBAIKAN.md`
- [x] Create technical docs: `DOKUMENTASI_TEKNIS.md` (this file)
- [ ] User runs SQL migration in Supabase Dashboard
- [ ] User verifies RLS policies are in place
- [ ] User tests login flow
- [ ] User verifies no error 406
- [ ] Deployment verified working

---

## References

### Supabase Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Policy Basics](https://supabase.com/docs/guides/auth/row-level-security/basics)
- [RLS Common Patterns](https://supabase.com/docs/guides/auth/row-level-security/policies)

### PostgreSQL Documentation
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [DROP POLICY](https://www.postgresql.org/docs/current/sql-droppolicy.html)

