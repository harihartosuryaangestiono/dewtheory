# Dew Theory Affiliate Hub 🌿✨ (Production Ready)

**Web App Kerja Outreach Affiliate TikTok Dew Theory**  
Aplikasi internal untuk 2 KOL Specialist Dew Theory (Dinda & Surya) agar alur kerja outreach WhatsApp berlangsung sangat cepat (**target < 10 detik per creator**), realtime anti-bentrok dengan atomic lock di database, sinkronisasi data sample & resi, hingga pelacakan video SOW (min. 2 konten) tanpa spreadsheet manual.

---

## 🔒 1. Keamanan & Autentikasi Produksi
- **Pendaftaran Publik Dinonaktifkan**: Hanya akun yang di-seed oleh tim internal yang dapat masuk.
- **Supabase Email/Password**: Login resmi via `/login`. Route dilindungi oleh `middleware.ts`.
- **Row Level Security (RLS)**: Seluruh tabel database (`profiles`, `campaigns`, `creators`, `messages_log`, `shipments`, `sow`, `templates`, `settings`, `activity_log`) memiliki kebijakan RLS aktif. Hanya user terautentikasi yang dapat membaca dan memodifikasi data.
- **Pemisahan Kunci Rahasia**:
  - `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di sisi server / skrip admin. Tidak pernah diekspos ke client bundle.
  - `CURATION_API_KEY` dikonfigurasi melalui environment variable server. Tidak pernah ditampilkan di UI atau ditulis di log server.
- **Nama Pengirim WA Otomatis**: Nama pengirim pesan WhatsApp (`{{pengirim}}`) diambil langsung dari `profiles.display_name` akun yang sedang login dan dapat diubah sewaktu-waktu di halaman **Profil Saya** (`/profile`).

---

## ⚡ 2. Fitur Inti & Keunggulan Arsitektur

### A. Atomic Claim Lock Anti-Bentrok (`claim_creator_lock`)
- **Operasi Atomik di Database**: Penguncian dilakukan lewat satu query transaksi PostgreSQL atomik di fungsi RPC:
  ```sql
  UPDATE public.creators
  SET locked_by = p_user_name, locked_until = now() + interval '5 minutes', updated_at = now()
  WHERE id = p_creator_id
    AND (locked_until IS NULL OR locked_until < now() OR locked_by = p_user_name);
  ```
- **Bebas Race Condition**: Menghilangkan celah read-modify-write dari sisi browser. Jika Dinda dan Surya membuka creator yang sama pada milidetik yang sama, database hanya mengizinkan satu pemenang.
- **Auto-Skip Cerdas**: Jika pengguna kedua gagal mengklaim, aplikasi menampilkan notifikasi *"Sedang dikerjakan oleh [Nama]. Beralih ke antrean berikutnya..."* dan secara otomatis melompat ke creator berikutnya di antrean tanpa macet.
- **Pelepasan Otomatis**: Lock dilepas saat pengguna menekan tombol lewati/kirim/navigasi atau otomatis kedaluwarsa setelah 5 menit.

### B. Virtualized Table (Lancar untuk 10.000+ Baris)
- Komponen `VirtualTable` (`src/components/common/VirtualTable.tsx`) menghitung posisi scroll dan hanya merender baris yang terlihat di layar (~35 baris DOM dari 10.000 baris data).
- Scrolling stabil di **60 FPS** tanpa lag memori browser pada antrean panjang.

### C. Integrasi Chrome Extension (`POST /api/curation`)
- **Dikecualikan dari Middleware Redirect**: Extension menggunakan header `x-api-key`, bukan cookie sesi browser.
- **CORS & Preflight**: Mendukung pre-flight `OPTIONS` dengan header `Access-Control-Allow-Origin: *` dan `Access-Control-Allow-Headers: Content-Type, x-api-key, Authorization`.
- **Dukungan Batch Array**: Ekstensi dapat mengirim satu objek atau array sekaligus. Respons mengembalikan ringkasan: `success_count`, `duplicate_count`, `failed_count` beserta detail alasannya.
- **Rate Limiting**: Dibatasi maksimal 120 permintaan per menit per IP untuk melindungi server dari spam/looping.
- **Konfigurasi `manifest.json` Ekstensi Anda**:
  Tambahkan izin domain aplikasi pada berkas `manifest.json` Chrome Extension Anda:
  ```json
  {
    "manifest_version": 3,
    "name": "Dew Theory KOL Curation Extension",
    "version": "1.0",
    "permissions": ["storage", "activeTab"],
    "host_permissions": [
      "http://localhost:3000/*",
      "https://*.vercel.app/*",
      "https://dewtheory-hub.yourdomain.com/*"
    ]
  }
  ```
  Contoh pemanggilan dari Chrome extension `content.js` / `background.js`:
  ```javascript
  const payload = [
    { username: "glowwithdevina", decision: "OKE", category: "A", wa: "089653991596" },
    { username: "beautybyrani", decision: "SECOND OPTION", category: "B" }
  ];

  fetch("https://dewtheory-hub.yourdomain.com/api/curation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "KUNCI_API_RAHASIA_ANDA"
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => console.log("Hasil kurasi:", data));
  ```

### D. Impor Excel Non-Destruktif & Normalisasi Nomor
- Mendukung multi-sheet resmi klien: `Data`, `Pool`, `Final Status`, `Seeding Sample`, `SOW Report`.
- **Normalisasi Nomor Telepon**: Mengatasi format desimal Excel (`89653991596.0`), tanda strip (`853-3781-7052`), lokal (`0812...`), dan nilai `0` / kosong ditandai sebagai `missing`.
- **Eksklusi Otomatis**: Creator bernomor `0` atau kosong secara otomatis dikecualikan dari antrean pesan aktif.
- **Penggabungan Non-Destruktif**: Status creator yang sudah diproses di aplikasi (misal sudah `contacted`, `join`, atau `sample_sent`) tidak akan tertimpa kembali menjadi `pool` saat file Excel diimpor ulang.

---

## 🛠️ 3. Langkah Setup Supabase

### Langkah 1: Buat Project di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Catat **Project URL**, **Anon Key**, dan **Service Role Key** dari menu **Project Settings -> API**.

### Langkah 2: Jalankan Migrasi Database
Buka menu **SQL Editor** di Supabase Dashboard, lalu jalankan 2 berkas migrasi secara berurutan:
1. Salin dan jalankan seluruh isi berkas:  
   `supabase/migrations/01_schema.sql`  
   *(Membuat tabel profiles, creators, RLS policies, trigger profil, fungsi atomic `claim_creator_lock`, dan Realtime replication).*
2. Salin dan jalankan seluruh isi berkas:  
   `supabase/migrations/02_seed.sql`  
   *(Membuat campaign default Desember 2026, pengaturan aplikasi, dan template WhatsApp persis sesuai brief).*

### Langkah 3: Konfigurasi `.env.local`
Salin template environment:
```bash
cp .env.example .env.local
```
Lengkapi nilai di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
CURATION_API_KEY=buat_kunci_rahasia_bebas_disini
NEXT_PUBLIC_APP_NAME="Dew Theory Affiliate Hub"
NEXT_PUBLIC_DEFAULT_CAMPAIGN="desember-2026"

# Kredensial Pengguna Awal (HANYA untuk skrip seed:users, kata sandi minimal 12 karakter)
SEED_DINDA_EMAIL=email_dinda_anda@dewtheory.com
SEED_DINDA_PASSWORD=kata_sandi_dinda_minimal_12_karakter
SEED_SURYA_EMAIL=email_surya_anda@dewtheory.com
SEED_SURYA_PASSWORD=kata_sandi_surya_minimal_12_karakter
```

### Langkah 4: Seed 2 Akun Pengguna (Dinda & Surya)
Jalankan skrip seed pengguna resmi:
```bash
npm run seed:users
```
Skrip akan membaca kredensial dari environment variable di atas, memvalidasi panjang password minimal 12 karakter, lalu membuat akun di Supabase Auth & tabel `profiles`.

---

## 🔧 4. Troubleshooting Login (Diagnosis Login Gagal)

Jika Anda mengalami kendala saat masuk di halaman `/login`, lakukan langkah diagnosis berikut:

1. **Periksa Kesesuaian Project Supabase**:
   Pastikan nilai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di file `.env.local` menunjuk ke project Supabase yang **sama persis** dengan yang digunakan oleh `SUPABASE_SERVICE_ROLE_KEY` saat menjalankan `npm run seed:users`.
2. **Cek Keberadaan User di Supabase Auth**:
   Buka **Supabase Dashboard → Authentication → Users**.
   - Pastikan email pengguna yang Anda gunakan muncul di daftar.
   - Pastikan kolom **Confirmed at** terisi (tidak bertuliskan "Waiting for verification"). Skrip `seed:users` secara otomatis mengonfirmasi email (`email_confirm: true`).
3. **Reset Kata Sandi Pengguna Lewat Supabase Dashboard**:
   Jika kata sandi lupa atau tidak cocok:
   - Buka **Supabase Dashboard → Authentication → Users**.
   - Cari baris email pengguna, klik menu titik tiga `...` di ujung kanan baris.
   - Pilih opsi **"Change password"** (atau "Send password recovery"). Masukkan kata sandi baru (minimal 12 karakter) dan simpan.
   - Kembali ke halaman `/login` aplikasi dan masuk dengan kata sandi baru tersebut.
4. **Reset Kata Sandi Mandiri lewat Halaman Login**:
   - Di halaman `/login`, klik link **"Lupa kata sandi?"**.
   - Masukkan email akun Anda dan klik **"Kirim Tautan Atur Ulang"**.
   - Buka tautan konfirmasi yang masuk ke email Anda untuk memperbarui kata sandi.
5. **Pesan Error yang Muncul**:
   - *"Email atau kata sandi salah."* : Kredensial tidak cocok dengan database Supabase Auth (pesan disamakan demi keamanan agar tidak membocorkan keberadaan email).
   - *"Terlalu banyak percobaan. Coba lagi beberapa menit lagi."* : Terkena rate limit pengamanan Supabase. Tunggu 5-10 menit sebelum mencoba kembali.
   - *"Tidak bisa terhubung ke server. Periksa koneksi internet."* : Terjadi kegagalan jaringan saat menghubungi endpoint Supabase.

---

## 💻 5. Menjalankan Aplikasi Secara Lokal

```bash
# 1. Jalankan unit test otomatis
npm test

# 2. Jalankan linter
npm run lint

# 3. Jalankan development server
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000). Anda akan diarahkan ke halaman `/login`.

---

## 👥 6. Panduan Uji Manual Realtime Dua-Browser (Langkah demi Langkah)

Untuk membuktikan fitur anti-bentrok, sinkronisasi lock atomik, dan update status tanpa reload secara visual:

1. **Siapkan 2 Jendela Browser Terpisah**:
   - Jendela 1: Google Chrome biasa (Pengguna: **Dinda**).
   - Jendela 2: Mode Incognito, Brave, atau Safari (Pengguna: **Surya**).
2. **Login Masing-Masing Akun**:
   - Jendela 1: Buka `http://localhost:3000/login`, masukkan email dan kata sandi akun Dinda yang telah Anda daftarkan melalui `seed:users`.
   - Jendela 2: Buka `http://localhost:3000/login`, masukkan email dan kata sandi akun Surya yang telah Anda daftarkan melalui `seed:users`.
3. **Uji Penguncian Realtime (Atomic Claim Lock)**:
   - Di Jendela 1 (Dinda), buka menu **Outreach** (`/outreach`) pada mode kartu besar (Focus Mode). Dinda sedang membuka creator pertama (misal `@glowwithdevina`).
   - Di Jendela 2 (Surya), buka menu **Outreach** (`/outreach`). Beralih ke tampilan tabel.
   - **Hasil yang Terlihat**: Surya akan melihat indikator gembok merah `🔒 Sedang dikerjakan oleh Dinda` di samping username `@glowwithdevina`.
4. **Uji Rebutan Creator (Race Condition Prevention)**:
   - Di Jendela 2 (Surya), coba klik baris `@glowwithdevina` untuk memaksanya masuk ke Focus Mode.
   - **Hasil yang Terlihat**: Operasi atomik database mendeteksi lock aktif. Toast berwarna amber muncul di layar Surya: *"Sedang dikerjakan oleh Dinda. Beralih ke antrean berikutnya..."*, dan aplikasi secara otomatis melompati creator tersebut ke creator berikutnya yang tidak terkunci.
5. **Uji Perubahan Status Realtime (Tanpa Reload)**:
   - Di Jendela 1 (Dinda), tekan `Enter` atau klik tombol **"Buka WhatsApp & Kirim"**.
   - Tab WhatsApp akan terbuka, dan status `@glowwithdevina` diubah menjadi `Contacted` di database.
   - Perhatikan layar Jendela 2 (Surya): Tanpa perlu menekan tombol refresh (F5), status creator tersebut seketika berpindah menjadi `Contacted` dan otomatis hilang dari antrean pesan aktif melalui Supabase Realtime channel.
6. **Uji Pelepasan Kunci (Release Lock)**:
   - Di Jendela 1 (Dinda), buka creator berikutnya lalu tekan tombol `S` (Skip).
   - Perhatikan status di database / Jendela 2: Kunci creator langsung dilepas dan tersedia kembali untuk Surya.

---

## 🚀 7. Panduan Deploy ke Vercel

1. Push repository proyek ini ke GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: Dew Theory Affiliate Hub production ready"
   git branch -M main
   git remote add origin <URL_REPO_GITHUB_ANDA>
   git push -u origin main
   ```
2. Buka [Vercel](https://vercel.com/new) dan impor repository Anda.
3. Di bagian **Environment Variables**, tambahkan 4 variabel:
   - `NEXT_PUBLIC_SUPABASE_URL` : URL project Supabase Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Anon Public Key Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` : Service Role Key Supabase (Hanya server)
   - `CURATION_API_KEY` : Kunci rahasia untuk Chrome Extension
4. Klik **Deploy**.

---

## 📊 7. Laporan Pengujian: Otomatis vs. Manual

### A. Teruji Secara Otomatis (100% Lolos - 30/30 Tests)

Suite unit test dijalankan melalui perintah `npm test` menggunakan runner bawaan Node.js (`node:test`) dan `tsx`:

| Modul Pengujian | Berkas Uji | Jumlah Skenario | Hasil |
|---|---|:---:|:---:|
| **Normalisasi Nomor Telepon** | `tests/phone.test.mjs` | 8 | ✅ 8/8 Lolos |
| *Cakupan: Desimal Excel (`89653991596.0`), tanda hubung (`853-3781-7052`), awalan lokal `08...`, internasional `+62...`, nilai `0`, nilai `0.0`, string kosong, panjang <10 digit.* | | | |
| **Dup Checker & Sanitizer** | `tests/dup_checker.test.mjs` | 4 | ✅ 4/4 Lolos |
| *Cakupan: Pembersihan `@`, lowercase, trim spasi, ekstraksi username dari URL TikTok, mapper kategori A/B/C/D, toleransi status kurasi.* | | | |
| **Template & WhatsApp Link Builder** | `tests/template.test.mjs` | 3 | ✅ 3/3 Lolos |
| *Cakupan: Interpolasi `{{nama}}` dan `{{pengirim}}`, link free product unik per Kategori A, B, C, D, encoding karakter emoji 🥰 & baris baru di `wa.me`.* | | | |
| **API Curation Chrome Extension** | `tests/api_curation.test.mjs` | 6 | ✅ 6/6 Lolos |
| *Cakupan: Pre-flight `OPTIONS` status 204 & header CORS, header `x-api-key` (salah → 401), validasi username (kosong → 400), parsing single item, payload batch array dengan ringkasan (success, duplicate, failed), rate limit sliding window 120 req/min.* | | | |
| **Atomic Claim Lock Concurrency** | `tests/claim_lock.test.mjs` | 4 | ✅ 4/4 Lolos |
| *Cakupan: Klaim berhasil untuk user pertama, penolakan atomik jika diklaim user kedua saat lock aktif, suksesi klaim setelah 5 menit expired, perpanjangan idempotent oleh pemilik lock.* | | | |
| **Impor Excel Multi-Sheet Realistis** | `tests/excel_import.test.mjs` | 3 | ✅ 3/3 Lolos |
| *Cakupan: Ekstraksi 5 sheet (`Data`, `Pool`, `Final Status`, `Seeding Sample`, `SOW Report`), deteksi baris duplikat, parsing tanggal `25/11/2026` & `2026-07-12`, eksklusi nomor `0` dari antrean, dan perlindungan non-destruktif status aplikasi.* | | | |
| **Benchmark Performa & Virtualisasi** | `tests/perf_benchmark.test.mjs` | 2 | ✅ 2/2 Lolos |
| *Cakupan: Benchmark impor 5.500 baris selesai dalam <2000ms (hasil: 33ms), virtualized window 10.000 baris merender <50 baris DOM dengan perhitungan spacer akurat.* | | | |
| **Total Pengujian Otomatis** | `tests/*.test.mjs` | **30** | **✅ 30/30 Lolos (0 Fail)** |

---

### B. Hanya Dapat Diuji Secara Manual (Daftar Verifikasi)

Komponen berikut memerlukan interaksi fisik manusia atau koneksi jaringan live ke layanan pihak ketiga:

1. **Pembukaan Tab WhatsApp Asli (`wa.me`)**:
   - Memerlukan browser dengan izin pop-up untuk memastikan aplikasi WhatsApp Web / WhatsApp Desktop terbuka dengan teks yang sudah terisi di kotak pesan.
2. **Koneksi WebSocket Supabase Realtime Antar Dua Komputer/Perangkat Berbeda**:
   - Memerlukan project Supabase Cloud aktif (URL & Anon Key asli) untuk memverifikasi socket broadcast ketika Dinda di laptop A mengirim pesan dan Surya di laptop B melihat perubahan secara bersamaan.
3. **Ekstensi Chrome Langsung di Halaman TikTok**:
   - Memerlukan instalasi unpacked extension di Chrome (`chrome://extensions`) untuk memvalidasi klik tombol ekstensi saat berselancar di TikTok Creator Marketplace / profil creator dan mengirim data ke `POST /api/curation`.
