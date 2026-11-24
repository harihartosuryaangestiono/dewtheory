import { Campaign, Creator, Shipment, SOWRecord, WhatsAppTemplate, AppConfig } from '@/types';
import { DEFAULT_CONFIG } from '../utils/template';

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

export const INITIAL_CREATORS: Creator[] = [
  // Kat A - Ready for Outreach
  {
    id: 'c-101',
    campaign_id: 'desember-2026',
    username: 'skincarebyrani',
    display_name: 'Rani Beauty Journal',
    phone_raw: '81290001742',
    phone_e164: '6281290001742',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'A',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'KOC spesialis hydrating toner, review jujur, engagement tinggi (GMV 4.2jt)',
    created_at: '2026-11-18T10:00:00Z',
    updated_at: '2026-11-18T10:00:00Z',
  },
  {
    id: 'c-102',
    campaign_id: 'desember-2026',
    username: 'glowwithdevina',
    display_name: 'Devina Skincare Diari',
    phone_raw: '89653991596.0',
    phone_e164: '6289653991596',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Amore',
    category: 'A',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Kulit dehidrasi & kusam, cocok untuk Dew Bright Toner',
    created_at: '2026-11-18T10:15:00Z',
    updated_at: '2026-11-18T10:15:00Z',
  },
  {
    id: 'c-103',
    campaign_id: 'desember-2026',
    username: 'nadia.skinroutine',
    display_name: 'Nadia Putri',
    phone_raw: '0853-3781-7052',
    phone_e164: '6285337817052',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'A',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Ingredient-led content, penjelasannya detail',
    created_at: '2026-11-18T11:00:00Z',
    updated_at: '2026-11-18T11:00:00Z',
  },
  // Kat B - Ready for Outreach
  {
    id: 'c-104',
    campaign_id: 'desember-2026',
    username: 'beautytips_alya',
    display_name: 'Alya Makeup & Skin',
    phone_raw: '81388721900',
    phone_e164: '6281388721900',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Amore',
    category: 'B',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Sering bikin video GRWM & skin prep sebelum foundation',
    created_at: '2026-11-18T11:30:00Z',
    updated_at: '2026-11-18T11:30:00Z',
  },
  {
    id: 'c-105',
    campaign_id: 'desember-2026',
    username: 'cindy.glowup',
    display_name: 'Cindy Aurelia',
    phone_raw: '081299881122',
    phone_e164: '6281299881122',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'B',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Estetik video clean & soft lighting',
    created_at: '2026-11-18T12:00:00Z',
    updated_at: '2026-11-18T12:00:00Z',
  },
  // Kat C - Cleanser
  {
    id: 'c-106',
    campaign_id: 'desember-2026',
    username: 'dika_grooming',
    display_name: 'Andika Male Grooming',
    phone_raw: '087811223344',
    phone_e164: '6287811223344',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Amore',
    category: 'C',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Konten cowok oily skin & cuci muka santai',
    created_at: '2026-11-18T13:00:00Z',
    updated_at: '2026-11-18T13:00:00Z',
  },
  // Kat D - Duo
  {
    id: 'c-107',
    campaign_id: 'desember-2026',
    username: 'dr.skincare.id',
    display_name: 'dr. Sarah Skin Coach',
    phone_raw: '81123456789',
    phone_e164: '6281123456789',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Direct',
    category: 'D',
    curation_status: 'oke',
    pipeline_status: 'curated',
    notes: 'Affiliate tier tinggi, konversi terbukti (GMV 8.5jt)',
    created_at: '2026-11-18T14:00:00Z',
    updated_at: '2026-11-18T14:00:00Z',
  },
  // Contacted state
  {
    id: 'c-108',
    campaign_id: 'desember-2026',
    username: 'tiara.skindiary',
    display_name: 'Tiara Putri',
    phone_raw: '081399887766',
    phone_e164: '6281399887766',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'A',
    curation_status: 'oke',
    pipeline_status: 'contacted',
    contacted_at: '2026-11-20T09:30:00Z',
    contacted_by: 'Dinda',
    created_at: '2026-11-19T09:00:00Z',
    updated_at: '2026-11-20T09:30:00Z',
  },
  // Join state + Sample Pending
  {
    id: 'c-109',
    campaign_id: 'desember-2026',
    username: 'fanya.beauty',
    display_name: 'Fanya Priscillia',
    phone_raw: '085712345678',
    phone_e164: '6285712345678',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Amore',
    category: 'B',
    curation_status: 'oke',
    pipeline_status: 'form_filled',
    contacted_at: '2026-11-19T10:00:00Z',
    contacted_by: 'Surya',
    created_at: '2026-11-19T08:00:00Z',
    updated_at: '2026-11-21T11:00:00Z',
  },
  // Sample Sent + SOW tracking
  {
    id: 'c-110',
    campaign_id: 'desember-2026',
    username: 'clarissa.dew',
    display_name: 'Clarissa Maharani',
    phone_raw: '081288990011',
    phone_e164: '6281288990011',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'D',
    curation_status: 'oke',
    pipeline_status: 'sample_sent',
    contacted_at: '2026-11-17T11:00:00Z',
    contacted_by: 'Dinda',
    created_at: '2026-11-17T09:00:00Z',
    updated_at: '2026-11-22T14:00:00Z',
  },
  // Second Option candidates (for promotion)
  {
    id: 'c-111',
    campaign_id: 'desember-2026',
    username: 'putri.glowrecipe',
    display_name: 'Putri Skincare',
    phone_raw: '081377889900',
    phone_e164: '6281377889900',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'RKP',
    category: 'A',
    curation_status: 'second_option',
    pipeline_status: 'curated',
    notes: 'Cadangan Kat A: konten bagus tapi GMV sedikit di bawah 1jt',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
  },
  {
    id: 'c-112',
    campaign_id: 'desember-2026',
    username: 'kevin.skingroom',
    display_name: 'Kevin Pratama',
    phone_raw: '085299887711',
    phone_e164: '6285299887711',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Amore',
    category: 'C',
    curation_status: 'second_option',
    pipeline_status: 'curated',
    notes: 'Cadangan Kat C: mikro creator cowok pemula',
    created_at: '2026-11-20T11:00:00Z',
    updated_at: '2026-11-20T11:00:00Z',
  },
  // Missing phone / Invalid phone
  {
    id: 'c-113',
    campaign_id: 'desember-2026',
    username: 'maya.nophone',
    display_name: 'Maya Skincare',
    phone_raw: '0',
    phone_e164: '',
    phone_status: 'missing',
    platform: 'TikTok',
    source: 'Data Sheet',
    category: 'B',
    curation_status: 'oke',
    pipeline_status: 'invalid_phone',
    notes: 'Nomor WA di sheet Data bernilai 0',
    created_at: '2026-11-20T12:00:00Z',
    updated_at: '2026-11-20T12:00:00Z',
  },
  // Reject
  {
    id: 'c-114',
    campaign_id: 'desember-2026',
    username: 'spammer_affiliate99',
    display_name: 'Spam Acc',
    phone_raw: '081233445566',
    phone_e164: '6281233445566',
    phone_status: 'valid',
    platform: 'TikTok',
    source: 'Pool',
    category: 'UNASSIGNED',
    curation_status: 'reject',
    pipeline_status: 'refuse',
    notes: 'Konten reupload tidak orisinil',
    created_at: '2026-11-20T13:00:00Z',
    updated_at: '2026-11-20T13:00:00Z',
  },
];

export const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'sh-101',
    creator_id: 'c-109',
    recipient_name: 'Fanya Priscillia',
    recipient_phone: '085712345678',
    address: 'Jl. Kemang Raya No. 12, Mampang Prapatan, Jakarta Selatan 12730',
    product: 'Bright Milky Lotion',
    status: 'pending',
    courier: 'J&T',
    created_at: '2026-11-21T11:00:00Z',
    updated_at: '2026-11-21T11:00:00Z',
  },
  {
    id: 'sh-102',
    creator_id: 'c-110',
    recipient_name: 'Clarissa Maharani',
    recipient_phone: '081288990011',
    address: 'Apartemen Sudirman Tower Lt. 18 Unit 18B, Karet Tengsin, Jakarta Pusat 10220',
    product: 'Toner + Lotion Duo',
    status: 'sent',
    tracking_no: 'JT9988776655ID',
    courier: 'J&T',
    sent_at: '2026-11-22T14:00:00Z',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-22T14:00:00Z',
  },
];

export const INITIAL_SOWS: SOWRecord[] = [
  {
    id: 'sow-101',
    creator_id: 'c-110',
    sow_no: 1,
    link: 'https://www.tiktok.com/@clarissa.dew/video/739128391209381',
    posted_at: '2026-11-23',
    status: 'verified',
    notes: 'Unboxing & first impression texture, keranjang kuning terpasang',
    created_at: '2026-11-23T15:00:00Z',
    updated_at: '2026-11-23T16:00:00Z',
  },
  {
    id: 'sow-102',
    creator_id: 'c-110',
    sow_no: 2,
    link: '',
    posted_at: null,
    status: 'pending',
    notes: 'Video routine 7 days test',
    created_at: '2026-11-23T15:00:00Z',
    updated_at: '2026-11-23T15:00:00Z',
  },
];
