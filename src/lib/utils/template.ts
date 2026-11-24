import { AppConfig, Category, Creator } from '@/types';

export const DEFAULT_CONFIG: AppConfig = {
  brand_name: "Dew Theory",
  shop_url: "https://vt.tiktok.com/ZS9fTwBy9BjBn-Zx4Lb/",
  form_url: "https://forms.gle/HrkL4oNaYCWWxj2w8",
  commission_rate: "8.5%",
  posting_deadline: "15 Desember",
  product_links: {
    A: "https://vt.tokopedia.com/t/ZS9PJPX8w4coe-KRxL6/",
    B: "https://vt.tokopedia.com/t/ZS9PJPbjUpfKe-dmnJF/",
    C: "https://vt.tokopedia.com/t/ZS9PJPtXU8DPK-W1WjD/",
    D: "https://vt.tokopedia.com/t/ZS9PJP39hWSpr-YkMR0/",
    UNASSIGNED: "https://vt.tokopedia.com/t/ZS9PJPX8w4coe-KRxL6/",
  },
  product_names: {
    A: "Dew Bright Toner",
    B: "Bright Milky Lotion",
    C: "Milky Dew Cleanser",
    D: "Toner + Lotion Duo",
    UNASSIGNED: "Dew Theory Skincare",
  },
  default_senders: ["Dinda", "Surya"],
  default_courier: "",
  enable_safety_delay: true,
  safety_delay_seconds: 3,
};

export interface InterpolateVariables {
  nama?: string;
  pengirim?: string;
  link_toko?: string;
  link_form?: string;
  link_produk?: string;
  deadline_posting?: string;
  komisi?: string;
  produk_sample?: string;
  kurir?: string;
  resi?: string;
}

export function renderTemplate(
  templateContent: string,
  variables: InterpolateVariables
): string {
  let result = templateContent;

  for (const [key, val] of Object.entries(variables)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(pattern, val || '');
  }

  return result;
}

export function buildWhatsAppLink(phoneE164: string, message: string): string {
  if (!phoneE164) return '#';
  const cleanPhone = phoneE164.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function getCreatorTemplateVariables(
  creator: Creator,
  senderName: string,
  config: AppConfig = DEFAULT_CONFIG
): InterpolateVariables {
  const cat = creator.category || 'A';
  const displayName = creator.display_name || creator.username;

  return {
    nama: displayName,
    pengirim: senderName || 'Dinda',
    link_toko: config.shop_url,
    link_form: config.form_url,
    link_produk: config.product_links[cat] || config.product_links.A,
    deadline_posting: config.posting_deadline,
    komisi: config.commission_rate,
    produk_sample: config.product_names[cat] || 'Produk Dew Theory',
    kurir: config.default_courier || '',
    resi: '-',
  };
}
