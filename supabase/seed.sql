-- ==============================================================================
-- DEW THEORY AFFILIATE HUB — INITIAL SEED DATA
-- ==============================================================================

-- 1. Default Campaign
insert into public.campaigns (
  id, name, is_active, target_affiliates, target_samples, 
  quota_a, quota_b, quota_c, quota_d,
  timeline_listing_start, timeline_listing_end,
  timeline_seeding_start, timeline_seeding_end,
  timeline_sow_start, timeline_sow_end, deadline_posting
) values (
  'desember-2026', 'Dew Theory Desember 2026', true, 100, 100,
  35, 25, 15, 25,
  '2026-11-16', '2026-11-22',
  '2026-11-16', '2026-11-30',
  '2026-11-25', '2026-12-25', '2026-12-15'
) on conflict (id) do nothing;

-- 2. Default Settings
insert into public.settings (key, value, description) values
('app_config', '{
  "brand_name": "Dew Theory",
  "shop_url": "https://vt.tiktok.com/ZS9fTwBy9BjBn-Zx4Lb/",
  "form_url": "https://forms.gle/HrkL4oNaYCWWxj2w8",
  "commission_rate": "8.5%",
  "posting_deadline": "15 Desember",
  "product_links": {
    "A": "https://vt.tokopedia.com/t/ZS9PJPX8w4coe-KRxL6/",
    "B": "https://vt.tokopedia.com/t/ZS9PJPbjUpfKe-dmnJF/",
    "C": "https://vt.tokopedia.com/t/ZS9PJPtXU8DPK-W1WjD/",
    "D": "https://vt.tokopedia.com/t/ZS9PJP39hWSpr-YkMR0/"
  },
  "product_names": {
    "A": "Dew Bright Toner",
    "B": "Bright Milky Lotion",
    "C": "Milky Dew Cleanser",
    "D": "Toner + Lotion Duo"
  },
  "default_senders": ["Dinda", "Surya"]
}'::jsonb, 'Konfigurasi umum aplikasi Dew Theory'),
('outreach_config', '{
  "daily_target": 60,
  "lock_duration_minutes": 5,
  "suggested_delay_seconds": 3
}'::jsonb, 'Pengaturan antrean WhatsApp outreach')
on conflict (key) do nothing;

-- 3. Default WhatsApp Templates
insert into public.templates (id, title, category, platform, content) values
('tiktok_a', 'TikTok Outreach - Kategori A (Dew Bright Toner)', 'A', 'TikTok',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} dari tim Affiliate Dew Theory lagi mencari creator baru untuk join affiliate Dew Theory nih!
Link toko: {{link_toko}}

Mandatory : 
- min. 2 Video TikTok atau 2 sesi Livestream (min 3 jam per sesi) 
- video include yellow cart
- deadline posting : {{deadline_posting}} 

dari aku akan support : 
💰 Komisi up to {{komisi}}
🎁 Free product Dew Theory : {{link_produk}}

Kalau kaka bersedia boleh langsung isi form registrasi disini untuk pengiriman sample nya ya kakk 
Link Form : {{link_form}}

Ditunggu kabar baiknya ya, Kak! 🥰'),

('tiktok_b', 'TikTok Outreach - Kategori B (Bright Milky Lotion)', 'B', 'TikTok',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} dari tim Affiliate Dew Theory lagi mencari creator baru untuk join affiliate Dew Theory nih!
Link toko: {{link_toko}}

Mandatory : 
- min. 2 Video TikTok atau 2 sesi Livestream (min 3 jam per sesi) 
- video include yellow cart
- deadline posting : {{deadline_posting}} 

dari aku akan support : 
💰 Komisi up to {{komisi}}
🎁 Free product Dew Theory : {{link_produk}}

Kalau kaka bersedia boleh langsung isi form registrasi disini untuk pengiriman sample nya ya kakk 
Link Form : {{link_form}}

Ditunggu kabar baiknya ya, Kak! 🥰'),

('tiktok_c', 'TikTok Outreach - Kategori C (Milky Dew Cleanser)', 'C', 'TikTok',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} dari tim Affiliate Dew Theory lagi mencari creator baru untuk join affiliate Dew Theory nih!
Link toko: {{link_toko}}

Mandatory : 
- min. 2 Video TikTok atau 2 sesi Livestream (min 3 jam per sesi) 
- video include yellow cart
- deadline posting : {{deadline_posting}} 

dari aku akan support : 
💰 Komisi up to {{komisi}}
🎁 Free product Dew Theory : {{link_produk}}

Kalau kaka bersedia boleh langsung isi form registrasi disini untuk pengiriman sample nya ya kakk 
Link Form : {{link_form}}

Ditunggu kabar baiknya ya, Kak! 🥰'),

('tiktok_d', 'TikTok Outreach - Kategori D (Toner + Lotion Duo)', 'D', 'TikTok',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} dari tim Affiliate Dew Theory lagi mencari creator baru untuk join affiliate Dew Theory nih!
Link toko: {{link_toko}}

Mandatory : 
- min. 2 Video TikTok atau 2 sesi Livestream (min 3 jam per sesi) 
- video include yellow cart
- deadline posting : {{deadline_posting}} 

dari aku akan support : 
💰 Komisi up to {{komisi}}
🎁 Free product Dew Theory : {{link_produk}}

Kalau kaka bersedia boleh langsung isi form registrasi disini untuk pengiriman sample nya ya kakk 
Link Form : {{link_form}}

Ditunggu kabar baiknya ya, Kak! 🥰'),

('shopee', 'Shopee Outreach Template', 'A', 'Shopee',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} dari tim Affiliate Dew Theory. Kami tertarik banget mengajak Kakak kolaborasi affiliate Dew Theory di Shopee Video & Live!

Support dari kami:
💰 Komisi menarik & voucher sample
🎁 Free product Dew Theory: {{link_produk}}

Untuk pendaftaran & pengiriman sample, yuk isi form registrasi berikut:
Link Form: {{link_form}}

Ditunggu kabar baiknya ya, Kak! 🥰'),

('followup_h2', 'Follow-up H+2 (Belum Balas)', null, 'TikTok',
'Halo Kak {{nama}}! 👋😊

aku {{pengirim}} mau follow up tawaran kolaborasi affiliate Dew Theory kemarin nih kakk.
Slot sample free product untuk campaign {{deadline_posting}} tinggal sedikit lagi.

Kira-kira Kakak tertarik untuk coba sample dan join affiliate kami? Ditunggu kabar baiknya ya kakk, makasih! ✨'),

('followup_h4', 'Follow-up H+4 (Peluang Terakhir)', null, 'TikTok',
'Halo Kak {{nama}}! ✨

Semoga harinya menyenangkan ya! Cuma mau info singkat, kami lagi finalisasi daftar affiliate Dew Theory batch ini.
Kalau Kakak masih ingin join dan dapat komisi {{komisi}} + free product, link form masih dibuka ya:
{{link_form}}

Kabari kami jika Kakak berminat ya, sukses selalu kak! 🙏'),

('sample_resi', 'Konfirmasi Pengiriman Sample & Resi', null, 'TikTok',
'Halo Kak {{nama}}! 📦✨

Kabar baik! Paket sample Dew Theory pesanan Kakak sudah kami kirimkan ya:
- Produk: {{produk_sample}}
- Kurir: {{kurir}}
- No. Resi: {{resi}}

Mohon konfirmasi jika barang sudah sampai ya kak. Jangan lupa unboxing & bersiap posting video SOW sebelum {{deadline_posting}} ya kak. Terima kasih banyak! 🥰'),

('reminder_posting', 'Reminder Posting Video SOW', null, 'TikTok',
'Halo Kak {{nama}}! 👋🥰

Gimana hasil pemakaian produk Dew Theory-nya kak? Semoga suka ya!
Mau mengingatkan sedikit untuk posting video SOW (min. 2 video include yellow cart), deadline posting tanggal {{deadline_posting}} ya kak.

Setelah posting, jangan lupa kirimkan link videonya ke kami ya. Terima kasih banyak atas kerjasamanya kak! ✨')
on conflict (id) do nothing;
