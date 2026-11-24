/**
 * Dew Theory Affiliate Hub — User Seeding Script
 * 
 * Script ini mendaftarkan 2 akun pengguna resmi (Dinda & Surya).
 * Membaca kredensial DARI ENVIRONMENT VARIABLES (tidak ada kredensial tertanam):
 * - SEED_DINDA_EMAIL
 * - SEED_DINDA_PASSWORD (minimal 12 karakter)
 * - SEED_SURYA_EMAIL
 * - SEED_SURYA_PASSWORD (minimal 12 karakter)
 * 
 * Cara menjalankan:
 * npm run seed:users
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// Native .env parser without external dependencies
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Load .env.local
loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-project-id') || serviceRoleKey.includes('your-service-role-key')) {
  console.error('\n❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local!');
  console.log('Silakan lengkapi .env.local Anda terlebih dahulu sebelum menjalankan script ini.\n');
  process.exit(1);
}

// 1. Read required credentials from environment
const dindaEmail = process.env.SEED_DINDA_EMAIL?.trim();
const dindaPassword = process.env.SEED_DINDA_PASSWORD;
const suryaEmail = process.env.SEED_SURYA_EMAIL?.trim();
const suryaPassword = process.env.SEED_SURYA_PASSWORD;

// 2. Strict validation: Cannot be empty
if (!dindaEmail || !dindaPassword || !suryaEmail || !suryaPassword) {
  console.error('\n❌ ERROR: Kredensial seed pengguna belum lengkap di .env.local!');
  console.error('Pastikan variabel berikut telah didefinisikan di .env.local:');
  console.error('  - SEED_DINDA_EMAIL');
  console.error('  - SEED_DINDA_PASSWORD');
  console.error('  - SEED_SURYA_EMAIL');
  console.error('  - SEED_SURYA_PASSWORD\n');
  process.exit(1);
}

// 3. Strict validation: Password must be at least 12 characters
if (dindaPassword.length < 12) {
  console.error(`\n❌ ERROR: SEED_DINDA_PASSWORD terlalu pendek (${dindaPassword.length} karakter). Minimal 12 karakter.\n`);
  process.exit(1);
}

if (suryaPassword.length < 12) {
  console.error(`\n❌ ERROR: SEED_SURYA_PASSWORD terlalu pendek (${suryaPassword.length} karakter). Minimal 12 karakter.\n`);
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SEED_USERS = [
  {
    email: dindaEmail,
    password: dindaPassword,
    displayName: 'Dinda',
    role: 'specialist',
  },
  {
    email: suryaEmail,
    password: suryaPassword,
    displayName: 'Surya',
    role: 'specialist',
  },
];

async function seed() {
  console.log('\n🌿 Memulai seed akun pengguna Dew Theory Affiliate Hub...');

  for (const user of SEED_USERS) {
    console.log(`\nMemproses akun: ${user.email} (${user.displayName})...`);

    // 1. Check if user already exists
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error(`Gagal mengambil daftar pengguna:`, listError.message);
      continue;
    }

    const existingUser = userList.users.find(u => u.email?.toLowerCase() === user.email.toLowerCase());

    let userId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          display_name: user.displayName,
          role: user.role,
        },
      });

      if (createError) {
        console.error(`❌ Gagal membuat user ${user.email}:`, createError.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`✅ User ${user.email} berhasil dibuat! (ID: ${userId})`);
    } else {
      console.log(`ℹ️ User ${user.email} sudah ada di Auth. (ID: ${userId})`);
    }

    // 2. Ensure Profile exists in public.profiles
    if (userId) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          display_name: user.displayName,
          role: user.role,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(`⚠️ Gagal upsert profiles untuk ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile untuk ${user.displayName} siap di database!`);
      }
    }
  }

  console.log('\n🎉 Selesai! Kedua akun siap digunakan untuk login.');
}

seed().catch(err => {
  console.error('Fatal error saat seeding:', err);
  process.exit(1);
});
