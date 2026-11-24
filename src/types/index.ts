export type Category = 'A' | 'B' | 'C' | 'D' | 'UNASSIGNED';

export type CurationStatus = 'pending' | 'oke' | 'second_option' | 'reject';

export type PipelineStatus = 
  | 'pool'
  | 'curated'
  | 'queued'
  | 'contacted'
  | 'replied'
  | 'join'
  | 'form_filled'
  | 'sample_sent'
  | 'sow_1'
  | 'sow_2'
  | 'completed'
  | 'refuse'
  | 'no_response'
  | 'invalid_phone';

export type PhoneStatus = 'valid' | 'missing' | 'invalid';

export type Platform = 'TikTok' | 'Shopee' | 'Instagram';

export interface Creator {
  id: string;
  campaign_id: string;
  username: string; // lowercase, trimmed, without @
  display_name?: string;
  phone_raw: string;
  phone_e164: string;
  phone_status: PhoneStatus;
  platform: Platform;
  source: string;
  category: Category;
  curation_status: CurationStatus;
  pipeline_status: PipelineStatus;
  notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  assigned_to?: string;
  locked_by?: string;
  locked_until?: string | null;
  contacted_at?: string | null;
  contacted_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  creator_id: string;
  recipient_name: string;
  recipient_phone: string;
  address: string;
  product: string;
  status: 'pending' | 'sent' | 'delivered';
  tracking_no?: string;
  courier: string;
  sent_at?: string | null;
  address_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SOWRecord {
  id: string;
  creator_id: string;
  sow_no: number; // 1, 2, ...
  link?: string;
  posted_at?: string | null;
  status: 'pending' | 'submitted' | 'verified' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  creator_id: string;
  user_name: string;
  template_type: string;
  message_body: string;
  sent_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  creator_id?: string;
  creator_username?: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  is_active: boolean;
  target_affiliates: number;
  target_samples: number;
  quota_a: number;
  quota_b: number;
  quota_c: number;
  quota_d: number;
  timeline_listing_start: string;
  timeline_listing_end: string;
  timeline_seeding_start: string;
  timeline_seeding_end: string;
  timeline_sow_start: string;
  timeline_sow_end: string;
  deadline_posting: string;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category?: Category | null;
  platform: Platform;
  content: string;
  updated_at: string;
}

export interface AppConfig {
  brand_name: string;
  shop_url: string;
  form_url: string;
  commission_rate: string;
  posting_deadline: string;
  product_links: Record<Category, string>;
  product_names: Record<Category, string>;
  default_senders: string[];
  default_courier?: string;
  enable_safety_delay?: boolean;
  safety_delay_seconds?: number;
}

export interface UserSession {
  email: string;
  name: string;
  role: 'admin' | 'specialist';
  id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'specialist';
  created_at?: string;
  updated_at?: string;
}
