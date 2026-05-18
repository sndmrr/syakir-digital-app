# CHECKLIST PERBAIKAN SUPABASE - Error 406

## Status Perbaikan

✅ **SUDAH DIPERBAIKI**:
- Migration file untuk RLS policies: `supabase/migrations/20260518_fix_rls_policies.sql`
- Instruksi lengkap: `INSTRUKSI_PERBAIKI_SUPABASE.md`

⏳ **PERLU DIJALANKAN OLEH USER**:
- Jalankan SQL migration di Supabase Dashboard

---

## Verifikasi Masalah yang Diperbaiki

### 1. ✅ Kode Frontend Authentication - BENAR
- [x] `useAuth.tsx` - Menggunakan Supabase authentication
- [x] `useUserRole.tsx` - Fetch data setelah user login
- [x] `useDepositDate.ts` - Fetch data setelah user login
- [x] Semua queries check `if (!user)` sebelum fetch
- [x] Tidak ada bypass authentication method

### 2. ⏳ RLS Policies - PERLU PERBAIKAN DI DATABASE
**Status**: Migration sudah dibuat, perlu dijalankan

**Masalah Awal**:
```
Error 406: Failed to load resource
Query: profiles?select=*&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce
Query: user_roles?select=role&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce
```

**Solusi**: Pastikan RLS policies untuk `user_roles` dan `profiles` mengizinkan:
- ✓ Authenticated users melihat data mereka sendiri
- ✓ Admins melihat semua data
- ✓ Proper INSERT/UPDATE/DELETE policies

### 3. Database User Sync - VERIFIKASI DIPERLUKAN
Pastikan setiap user login harus memiliki:
- ✓ Entry di `auth.users` table (email: `{username}@syakirdigital.local`)
- ✓ Entry di `profiles` table (dengan user_id yang match)
- ✓ Entry di `user_roles` table (dengan role: 'admin' atau 'mitra')

---

## Langkah-Langkah Eksekusi

### LANGKAH 1: Jalankan SQL Migration
**File**: `supabase/migrations/20260518_fix_rls_policies.sql`
**Lokasi**: Supabase Dashboard → SQL Editor
**Waktu**: ~30 detik

### LANGKAH 2: Verifikasi RLS Policies
**Lokasi**: Supabase Dashboard → Database → Policies
**Cek Tabel `user_roles`**:
- [ ] "Users can view their own role" (SELECT)
- [ ] "Admins can view all roles" (SELECT)
- [ ] "Admins can insert roles" (INSERT)
- [ ] "Admins can update roles" (UPDATE)
- [ ] "Admins can delete roles" (DELETE)

**Cek Tabel `profiles`**:
- [ ] "Users can view their own profile" (SELECT)
- [ ] "Admins can view all profiles" (SELECT)
- [ ] "Admins can insert profiles" (INSERT)
- [ ] "Admins can update profiles" (UPDATE)
- [ ] "Admins can delete profiles" (DELETE)

### LANGKAH 3: Test Login
1. Clear browser cache: Press Ctrl+Shift+Delete
2. Refresh aplikasi: F5 atau Ctrl+R
3. Login dengan username yang terdaftar
4. Verifikasi:
   - [ ] Loading selesai (bukan infinite loop)
   - [ ] Masuk ke dashboard
   - [ ] Tidak ada error 406 di console
   - [ ] Data profile dan role tampil dengan benar

### LANGKAH 4: Verifikasi User di Database
**Lokasi**: Supabase Dashboard → Database → SQL Editor

Jalankan query ini untuk setiap user yang login:
```sql
-- Cek apakah user ada di semua tabel yang diperlukan
SELECT 
  au.id,
  au.email,
  p.full_name,
  ur.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email LIKE '%@syakirdigital.local';
```

**Hasil yang diharapkan**: Setiap user harus memiliki:
- [ ] ID di auth.users
- [ ] full_name di profiles
- [ ] role di user_roles

---

## Troubleshooting

### Jika Masih Error 406 Setelah Jalankan SQL:

1. **Clear Browser Cache**
   - Ctrl+Shift+Delete
   - Hapus All time
   - Refresh

2. **Cek RLS Policies di Dashboard**
   - Buka Database → Policies
   - Pastikan semua policies sudah ada
   - Jika tidak ada, jalankan SQL kembali

3. **Cek User di Database**
   - Pastikan email user di auth.users: `{username}@syakirdigital.local`
   - Pastikan profiles dan user_roles punya entry untuk user tersebut

4. **Cek Browser Console**
   - F12 → Console tab
   - Cari error message yang lebih detail
   - Screenshot error untuk debugging

5. **Reset AppVersion (Force Re-login)**
   - Di browser console, jalankan:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
   - Refresh halaman
   - Login ulang

### Jika Masih Tidak Bisa Fix:
- Hubungi support dengan screenshot:
  - Error message dari browser console
  - Database schema untuk tables: auth.users, profiles, user_roles
  - RLS policies configuration

---

## Keamanan Setelah Perbaikan

✅ **Terlindungi**:
- Hanya authenticated users yang bisa login
- User hanya bisa lihat data mereka sendiri
- Admin bisa lihat dan manage semua user data
- RLS policies enforce access control di database level

✅ **Tidak ada bypass authentication** di code

---

## Catatan Penting

- **JANGAN ubah RLS policies tanpa panduan**
- **JANGAN disable RLS** tanpa alasan kuat
- **BACKUP database** sebelum membuat perubahan besar
- Setiap perubahan harus melalui migration untuk tracking
- Verifikasi di dev environment sebelum production

---

## File yang Berubah

1. ✅ `supabase/migrations/20260518_fix_rls_policies.sql` - **BARU** (Fix RLS policies)
2. ✅ `INSTRUKSI_PERBAIKI_SUPABASE.md` - **BARU** (Instruksi lengkap)
3. ✅ `CHECKLIST_PERBAIKAN.md` - **INI FILE** (Verification checklist)

**TIDAK ADA perubahan pada**:
- ✓ Frontend code (useAuth.tsx, useUserRole.tsx, dll)
- ✓ Application logic
- ✓ UI Components
- ✓ Database schema (hanya RLS policies)

