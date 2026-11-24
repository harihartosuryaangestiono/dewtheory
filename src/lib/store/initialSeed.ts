import { Campaign, Creator, Shipment, SOWRecord, WhatsAppTemplate } from '@/types';

export const INITIAL_CAMPAIGN: Campaign = {
  id: 'desember-2026',
  name: 'Dew Theory Desember 2026',
  is_active: true,
  target_affiliates: 100,
  target_samples: 100,
  quota_a: 35,
  quota_b: 25,
  quota_c: 15,
  quota_d: 25,
  timeline_listing_start: '2026-11-16',
  timeline_listing_end: '2026-11-22',
  timeline_seeding_start: '2026-11-16',
  timeline_seeding_end: '2026-11-30',
  timeline_sow_start: '2026-11-25',
  timeline_sow_end: '2026-12-25',
  deadline_posting: '15 Desember',
  created_at: new Date().toISOString(),
};

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tiktok_a',
    title: 'TikTok Outreach - Kategori A (Dew Bright Toner)',
    category: 'A',
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋😊

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

Ditunggu kabar baiknya ya, Kak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tiktok_b',
    title: 'TikTok Outreach - Kategori B (Bright Milky Lotion)',
    category: 'B',
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋😊

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

Ditunggu kabar baiknya ya, Kak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tiktok_c',
    title: 'TikTok Outreach - Kategori C (Milky Dew Cleanser)',
    category: 'C',
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋😊

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

Ditunggu kabar baiknya ya, Kak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tiktok_d',
    title: 'TikTok Outreach - Kategori D (Toner + Lotion Duo)',
    category: 'D',
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋😊

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

Ditunggu kabar baiknya ya, Kak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shopee',
    title: 'Shopee Outreach Template',
    category: 'A',
    platform: 'Shopee',
    content: `Halo Kak {{nama}}! 👋😊

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

Ditunggu kabar baiknya ya, Kak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'followup_h2',
    title: 'Follow-up H+2 (Belum Balas)',
    category: null,
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋😊

aku {{pengirim}} mau follow up tawaran kolaborasi affiliate Dew Theory kemarin nih kakk.
Slot sample free product untuk campaign {{deadline_posting}} tinggal sedikit lagi.

Kira-kira Kakak tertarik untuk coba sample dan join affiliate kami? Ditunggu kabar baiknya ya kakk, makasih! ✨`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'followup_h4',
    title: 'Follow-up H+4 (Peluang Terakhir)',
    category: null,
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! ✨

Semoga harinya menyenangkan ya! Cuma mau info singkat, kami lagi finalisasi daftar affiliate Dew Theory batch ini.
Kalau Kakak masih ingin join dan dapat komisi {{komisi}} + free product, link form masih dibuka ya:
{{link_form}}

Kabari kami jika Kakak berminat ya, sukses selalu kak! 🙏`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample_resi',
    title: 'Konfirmasi Pengiriman Sample & Resi',
    category: null,
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 📦✨

Kabar baik! Paket sample Dew Theory pesanan Kakak sudah kami kirimkan ya:
- Produk: {{produk_sample}}
- Kurir: {{kurir}}
- No. Resi: {{resi}}

Mohon konfirmasi jika barang sudah sampai ya kak. Jangan lupa unboxing & bersiap posting video SOW sebelum {{deadline_posting}} ya kak. Terima kasih banyak! 🥰`,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'reminder_posting',
    title: 'Reminder Posting Video SOW',
    category: null,
    platform: 'TikTok',
    content: `Halo Kak {{nama}}! 👋🥰

Gimana hasil pemakaian produk Dew Theory-nya kak? Semoga suka ya!
Mau mengingatkan sedikit untuk posting video SOW (min. 2 video include yellow cart), deadline posting tanggal {{deadline_posting}} ya kak.

Setelah posting, jangan lupa kirimkan link videonya ke kami ya. Terima kasih banyak atas kerjasamanya kak! ✨`,
    updated_at: new Date().toISOString(),
  },
];

// Clean empty database states - no dummy creators, shipments, or SOWs
export const INITIAL_CREATORS: Creator[] = [];
export const INITIAL_SHIPMENTS: Shipment[] = [];
export const INITIAL_SOWS: SOWRecord[] = [];
