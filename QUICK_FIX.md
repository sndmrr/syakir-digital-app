# PERBAIKAN CEPAT - Error 406 Supabase

## 🔴 MASALAH
- Aplikasi stuck loading saat login
- Error: `Failed to load resource: the server responded with a status of 406`
- User sudah ada di database tapi tidak bisa login

## 🟢 SOLUSI (3 LANGKAH)

### LANGKAH 1️⃣: Jalankan SQL di Supabase Dashboard

1. Buka: https://app.supabase.com/ → Login
2. Pilih project: "Revapppulsasnd"
3. Klik: SQL Editor (di sidebar kiri)
4. Buka file: `supabase/migrations/20260518_fix_rls_policies.sql`
5. Copy SEMUA isi file tersebut
6. Paste ke SQL Editor
7. Klik: RUN (atau Ctrl+Enter)
8. Tunggu sampai selesai ✓

### LANGKAH 2️⃣: Verifikasi di Dashboard

1. Klik: Database → Policies (di sidebar)
2. Cari tabel: `user_roles`
3. Pastikan ada policies (seharusnya 5):
   - ✓ Users can view their own role
   - ✓ Admins can view all roles
   - ✓ Admins can insert roles
   - ✓ Admins can update roles
   - ✓ Admins can delete roles

4. Cari tabel: `profiles`
5. Pastikan ada policies (seharusnya 5):
   - ✓ Users can view their own profile
   - ✓ Admins can view all profiles
   - ✓ Admins can insert profiles
   - ✓ Admins can update profiles
   - ✓ Admins can delete profiles

### LANGKAH 3️⃣: Test Login

1. Buka aplikasi web
2. Tekan Ctrl+Shift+Delete (hapus cache)
3. Refresh: F5
4. Login dengan username + password
5. Verifikasi:
   - ✓ Loading selesai
   - ✓ Masuk ke dashboard
   - ✓ Tidak ada error di console (F12)

## ✅ DONE!

Aplikasi sekarang berfungsi normal dengan keamanan yang benar.

---

## 📋 DETAIL UNTUK ADVANCED USERS

### Apa yang Diperbaiki?
RLS (Row Level Security) policies pada tabel `profiles` dan `user_roles` yang memungkinkan:
- User melihat data mereka sendiri
- Admin melihat semua data user
- Proper access control di database level

### Mengapa Error 406?
Sebelumnya, RLS policies tidak ada atau salah, sehingga query ditolak database dengan status 406 (Not Acceptable).

### Keamanan
✓ Tetap aman - hanya authenticated users yang bisa login
✓ Tetap secure - user hanya lihat data mereka sendiri
✓ Admin tetap bisa manage semua user

### File yang Diubah
- `supabase/migrations/20260518_fix_rls_policies.sql` - NEW (migration SQL)
- Tidak ada perubahan di frontend code
- Tidak ada perubahan di struktur database

---

## 🆘 JIKA MASIH ERROR

**Error masih ada setelah langkah di atas?**

1. Clear browser cache: Ctrl+Shift+Delete → All time
2. Close browser completely
3. Buka fresh browser window
4. Buka aplikasi lagi
5. Test login

**Masih error?**

Jalankan query ini di SQL Editor untuk debug:
```sql
SELECT 
  au.id,
  au.email,
  p.full_name,
  ur.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email LIKE '%@syakirdigital.local'
LIMIT 10;
```

Pastikan setiap user punya:
- ✓ Email di auth.users
- ✓ full_name di profiles
- ✓ role di user_roles

**Masih stuck?**

Lihat file untuk detail lebih lanjut:
- `INSTRUKSI_PERBAIKI_SUPABASE.md` - instruksi lengkap
- `CHECKLIST_PERBAIKAN.md` - verification checklist
- `DOKUMENTASI_TEKNIS.md` - penjelasan teknis mendalam

---

## ⏱️ WAKTU TOTAL: ~5 MENIT

- SQL run: ~30 detik
- Verifikasi policies: ~1 menit
- Browser cache clear & test: ~3 menit

---

**Selesai! Aplikasi siap digunakan.** ✓
