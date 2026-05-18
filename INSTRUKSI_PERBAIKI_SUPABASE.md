# INSTRUKSI MEMPERBAIKI KONEKSI SUPABASE - Error 406

## Masalah yang Terjadi

Saat login, aplikasi mengalami loading loop dengan error 406 pada queries:
- `profiles?select=*&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce` 
- `user_roles?select=role&user_id=eq.221add75-bf5b-4889-95e3-63baef64d1ce`

**Penyebab**: RLS (Row Level Security) policies pada tabel `profiles` dan `user_roles` tidak mengizinkan authenticated users untuk mengakses data mereka sendiri.

## Solusi

Jalankan SQL migration yang sudah kami siapkan untuk memperbaiki RLS policies.

### Langkah-Langkah:

1. **Buka Supabase Dashboard**
   - Kunjungi: https://app.supabase.com/
   - Login ke akun Anda
   - Pilih project "Revapppulsasnd"

2. **Buka SQL Editor**
   - Di sidebar kiri, pilih "SQL Editor"
   - Atau klik "New Query"

3. **Copy dan Paste SQL Berikut**
   - Buka file: `supabase/migrations/20260518_fix_rls_policies.sql`
   - Copy semua isi file tersebut
   - Paste ke SQL Editor di Supabase Dashboard

4. **Jalankan Query**
   - Klik tombol "RUN" atau tekan Ctrl+Enter
   - Tunggu sampai query selesai (ditandai dengan pesan sukses)

5. **Verifikasi Policies**
   - Buka "Database" → "Policies"
   - Pastikan tabel `user_roles` dan `profiles` memiliki policies berikut:
     - "Users can view their own role" (SELECT)
     - "Users can view their own profile" (SELECT)
     - "Admins can view all roles" (SELECT)
     - "Admins can view all profiles" (SELECT)
     - Dan policies lainnya untuk INSERT, UPDATE, DELETE

6. **Test Login**
   - Refresh aplikasi web Anda
   - Coba login kembali
   - Seharusnya loading selesai dan masuk ke dashboard

## Apa yang Diperbaiki

### Tabel `user_roles`
- ✓ Policy: Users dapat melihat role mereka sendiri
- ✓ Policy: Admins dapat melihat semua roles
- ✓ Policy: Admins dapat insert/update/delete roles

### Tabel `profiles`
- ✓ Policy: Users dapat melihat profile mereka sendiri
- ✓ Policy: Admins dapat melihat semua profiles
- ✓ Policy: Admins dapat insert/update/delete profiles

## Keamanan

Perubahan ini MEMASTIKAN bahwa:
- Hanya user yang ter-authenticate (ada di `auth.users`) yang bisa login
- User hanya bisa melihat data mereka sendiri
- Admin dapat mengelola semua user data
- Tidak ada akses unauthenticated ke data sensitif

Ini adalah konfigurasi keamanan yang BENAR seperti seharusnya aplikasi berjalan dari awal.

## Jika Masih Ada Error

Jika masih terjadi error setelah menjalankan SQL:

1. Pastikan semua user yang ingin login:
   - ✓ Ada di tabel `auth.users` (dengan email: `{username}@syakirdigital.local`)
   - ✓ Ada di tabel `profiles` (dengan user_id yang match)
   - ✓ Ada di tabel `user_roles` (dengan role: 'admin' atau 'mitra')

2. Check browser console untuk error message yang lebih detail
3. Hubungi support jika masih ada masalah

## Catatan Penting

- Jangan ubah struktur tabel atau RLS policies tanpa pengetahuan yang cukup
- Setiap perubahan di database harus melalui migration untuk tracking
- Backup database secara berkala
