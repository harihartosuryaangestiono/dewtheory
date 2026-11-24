import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  renderTemplate, 
  buildWhatsAppLink, 
  getCreatorTemplateVariables, 
  DEFAULT_CONFIG 
} from '../src/lib/utils/template.ts';

const SAMPLE_CREATOR_A = {
  id: 'c-1',
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SAMPLE_CREATOR_B = {
  ...SAMPLE_CREATOR_A,
  username: 'beautytips_alya',
  category: 'B',
};

const SAMPLE_CREATOR_C = {
  ...SAMPLE_CREATOR_A,
  username: 'dika_grooming',
  category: 'C',
};

const SAMPLE_CREATOR_D = {
  ...SAMPLE_CREATOR_A,
  username: 'dr.skincare.id',
  category: 'D',
};

test('Template Interpolation: Replaces {{nama}}, {{pengirim}}, and links accurately', () => {
  const template = `Halo Kak {{nama}}! 👋😊
aku {{pengirim}} dari tim Affiliate Dew Theory.
Link toko: {{link_toko}}
Komisi: {{komisi}}
Free product: {{link_produk}}
Link Form: {{link_form}}
Ditunggu kabar baiknya ya, Kak! 🥰`;

  const vars = getCreatorTemplateVariables(SAMPLE_CREATOR_A, 'Dinda', DEFAULT_CONFIG);
  const result = renderTemplate(template, vars);

  assert.ok(result.includes('Halo Kak Rani Beauty Journal! 👋😊'));
  assert.ok(result.includes('aku Dinda dari tim Affiliate Dew Theory.'));
  assert.ok(result.includes(DEFAULT_CONFIG.shop_url));
  assert.ok(result.includes(DEFAULT_CONFIG.commission_rate));
  assert.ok(result.includes(DEFAULT_CONFIG.product_links.A));
  assert.ok(result.includes(DEFAULT_CONFIG.form_url));
  assert.ok(result.includes('Ditunggu kabar baiknya ya, Kak! 🥰'));
});

test('Template Selection: Returns distinct product links per Category A, B, C, D', () => {
  const varsA = getCreatorTemplateVariables(SAMPLE_CREATOR_A, 'Dinda', DEFAULT_CONFIG);
  const varsB = getCreatorTemplateVariables(SAMPLE_CREATOR_B, 'Surya', DEFAULT_CONFIG);
  const varsC = getCreatorTemplateVariables(SAMPLE_CREATOR_C, 'Dinda', DEFAULT_CONFIG);
  const varsD = getCreatorTemplateVariables(SAMPLE_CREATOR_D, 'Surya', DEFAULT_CONFIG);

  assert.equal(varsA.link_produk, 'https://vt.tokopedia.com/t/ZS9PJPX8w4coe-KRxL6/');
  assert.equal(varsB.link_produk, 'https://vt.tokopedia.com/t/ZS9PJPbjUpfKe-dmnJF/');
  assert.equal(varsC.link_produk, 'https://vt.tokopedia.com/t/ZS9PJPtXU8DPK-W1WjD/');
  assert.equal(varsD.link_produk, 'https://vt.tokopedia.com/t/ZS9PJP39hWSpr-YkMR0/');
});

test('WhatsApp URL Builder: Generates valid wa.me link with encoded text', () => {
  const phone = '6281290001742';
  const text = 'Halo Kak Rani! 👋😊\nDitunggu kabar baiknya ya, Kak! 🥰';
  const link = buildWhatsAppLink(phone, text);

  assert.ok(link.startsWith('https://wa.me/6281290001742?text='));
  assert.ok(link.includes('%F0%9F%A5%B0')); // Encoded 🥰 emoji
  assert.ok(link.includes('%0A')); // Encoded newline
});
