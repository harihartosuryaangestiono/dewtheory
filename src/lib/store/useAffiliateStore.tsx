'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Campaign, 
  Creator, 
  Shipment, 
  SOWRecord, 
  WhatsAppTemplate, 
  AppConfig, 
  UserSession, 
  ActivityLog, 
  Category, 
  CurationStatus, 
  PipelineStatus 
} from '@/types';
import { 
  INITIAL_CAMPAIGN, 
  INITIAL_CREATORS, 
  INITIAL_TEMPLATES, 
  INITIAL_SHIPMENTS, 
  INITIAL_SOWS 
} from './initialSeed';
import { DEFAULT_CONFIG } from '../utils/template';
import { shouldPreserveExistingStatus } from '../utils/excel';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

interface DailyStats {
  date: string;
  count: number;
}

interface AffiliateContextType {
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  campaign: Campaign;
  updateCampaign: (camp: Partial<Campaign>) => void;
  creators: Creator[];
  shipments: Shipment[];
  sows: SOWRecord[];
  templates: WhatsAppTemplate[];
  config: AppConfig;
  activityLogs: ActivityLog[];
  dailyOutreachCount: number;
  dailyTarget: number;
  
  // Actions
  claimCreator: (id: string) => Promise<{ success: boolean; locked_by?: string }>;
  releaseCreator: (id: string) => void;
  markContacted: (id: string, templateType: string, messageBody: string) => void;
  undoContacted: (id: string) => void;
  markRefuse: (id: string, notes?: string) => void;
  markInvalidPhone: (id: string) => void;
  updateCuration: (id: string, curation: CurationStatus, category?: Category) => void;
  batchUpdateCuration: (ids: string[], curation: CurationStatus, category?: Category) => void;
  promoteSecondOption: (id: string, category: Category) => void;
  autoSplitQueue: (user1Name: string, user2Name: string) => void;
  upsertShipment: (shipment: Partial<Shipment> & { creator_id: string }) => void;
  batchUpdateTracking: (items: { username: string; tracking_no: string; courier?: string }[]) => number;
  upsertSOW: (sow: Partial<SOWRecord> & { creator_id: string; sow_no: number }) => void;
  updateTemplate: (id: string, content: string) => void;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  importCreatorsBatch: (newCreators: Partial<Creator>[], newShipments?: Partial<Shipment>[], newSows?: Partial<SOWRecord>[]) => { added: number; updated: number };
  resetToDefaultSeed: () => void;
}

const DEFAULT_USER: UserSession = {
  name: 'Dinda',
  email: 'dindavictora1509@gmail.com',
  role: 'specialist',
};

const AffiliateContext = createContext<AffiliateContextType | null>(null);

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSession>(DEFAULT_USER);
  const [campaign, setCampaign] = useState<Campaign>(INITIAL_CAMPAIGN);
  const [creators, setCreators] = useState<Creator[]>(INITIAL_CREATORS);
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [sows, setSows] = useState<SOWRecord[]>(INITIAL_SOWS);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(INITIAL_TEMPLATES);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStats>>({});

  // 1. Load User Session from Supabase Auth & public.profiles
  useEffect(() => {
    let mounted = true;

    async function loadAuthUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          // Fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, role, email')
            .eq('id', user.id)
            .single();

          const displayName = profile?.display_name || user.user_metadata?.display_name || 'Dinda';
          setCurrentUser({
            id: user.id,
            email: user.email || 'user@dewtheory.com',
            name: displayName,
            role: (profile?.role as any) || 'specialist',
          });
        }
      } catch (err) {
        // Fallback to default user
      }
    }

    loadAuthUser();

    // Listen to Auth State Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, role, email')
          .eq('id', session.user.id)
          .single();

        const displayName = profile?.display_name || session.user.user_metadata?.display_name || 'Dinda';
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || 'user@dewtheory.com',
          name: displayName,
          role: (profile?.role as any) || 'specialist',
        });
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. Load Data from Supabase
  useEffect(() => {
    let mounted = true;

    async function fetchDatabaseData() {
      try {
        // Fetch Creators
        const { data: dbCreators } = await supabase
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false });

        if (mounted) {
          setCreators(dbCreators || []);
        }

        // Fetch Shipments
        const { data: dbShipments } = await supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false });

        if (mounted) {
          setShipments(dbShipments || []);
        }

        // Fetch SOWs
        const { data: dbSows } = await supabase
          .from('sow')
          .select('*');

        if (mounted) {
          setSows(dbSows || []);
        }

        // Fetch Templates
        const { data: dbTemplates } = await supabase
          .from('templates')
          .select('*');

        if (dbTemplates && dbTemplates.length > 0 && mounted) {
          setTemplates(dbTemplates);
        }

        // Fetch Settings
        const { data: dbSettings } = await supabase
          .from('settings')
          .select('*');

        if (dbSettings && dbSettings.length > 0 && mounted) {
          const appConfigSetting = dbSettings.find(s => s.key === 'app_config');
          if (appConfigSetting?.value) {
            setConfig(prev => ({ ...prev, ...appConfigSetting.value }));
          }
        }

        // Fetch Campaign
        const { data: dbCampaign } = await supabase
          .from('campaigns')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (dbCampaign && mounted) {
          setCampaign(dbCampaign);
        }
      } catch (err) {
        console.error('Initial Supabase fetch note:', err);
      }
    }

    fetchDatabaseData();

    // 3. Setup Supabase Realtime Subscription
    const channel = supabase.channel('affiliate_hub_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creators' }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT') {
          const newCreator = payload.new as Creator;
          setCreators(prev => [newCreator, ...prev.filter(c => c.id !== newCreator.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedCreator = payload.new as Creator;
          setCreators(prev => prev.map(c => c.id === updatedCreator.id ? { ...c, ...updatedCreator } : c));
        } else if (payload.eventType === 'DELETE') {
          setCreators(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = payload.new as Shipment;
          setShipments(prev => {
            const idx = prev.findIndex(s => s.id === item.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = item;
              return copy;
            }
            return [item, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sow' }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const item = payload.new as SOWRecord;
          setSows(prev => {
            const idx = prev.findIndex(s => s.id === item.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = item;
              return copy;
            }
            return [item, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (!mounted) return;
        if (payload.eventType === 'UPDATE' && payload.new.id === currentUser.id) {
          setCurrentUser(prev => ({ ...prev, name: payload.new.display_name }));
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser.id]);

  // Today's outreach count for currentUser
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dailyOutreachCount = useMemo(() => {
    const key = `${currentUser.name}_${todayStr}`;
    return dailyStats[key]?.count || 0;
  }, [dailyStats, currentUser.name, todayStr]);

  const addActivity = useCallback(async (action: string, creatorUsername?: string, details?: string, creatorId?: string) => {
    const newLog: ActivityLog = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      user_name: currentUser.name,
      creator_id: creatorId,
      creator_username: creatorUsername,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);

    try {
      await supabase.from('activity_log').insert({
        user_name: currentUser.name,
        creator_id: creatorId,
        creator_username: creatorUsername,
        action,
        details,
      });
    } catch (e) {
      // Non-blocking
    }
  }, [currentUser.name]);

  // Atomic claim lock: invokes RPC or atomic conditional update
  const claimCreator = useCallback(async (id: string): Promise<{ success: boolean; locked_by?: string }> => {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    try {
      // 1. Try atomic Supabase RPC function first
      const { data, error } = await supabase.rpc('claim_creator_lock', {
        p_creator_id: id,
        p_user_name: currentUser.name,
        p_lock_minutes: 5,
      });

      if (!error && data) {
        if (data.success) {
          setCreators(prev => prev.map(c => c.id === id ? { ...c, locked_by: currentUser.name, locked_until: data.locked_until } : c));
          return { success: true, locked_by: currentUser.name };
        } else {
          setCreators(prev => prev.map(c => c.id === id ? { ...c, locked_by: data.locked_by, locked_until: data.locked_until } : c));
          return { success: false, locked_by: data.locked_by };
        }
      }
    } catch (e) {
      // Fallback
    }

    // 2. Fallback: Atomic local state evaluation
    let result = { success: false, locked_by: 'Pengguna Lain' };
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;

      const isLockedByOther = Boolean(
        c.locked_by &&
        c.locked_by !== currentUser.name &&
        c.locked_until &&
        new Date(c.locked_until) > now
      );

      if (isLockedByOther) {
        result = { success: false, locked_by: c.locked_by || 'Pengguna Lain' };
        return c;
      }

      result = { success: true, locked_by: currentUser.name };
      return {
        ...c,
        locked_by: currentUser.name,
        locked_until: lockExpiry,
      };
    }));

    return result;
  }, [currentUser.name]);

  // Release creator lock
  const releaseCreator = useCallback((id: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.locked_by === currentUser.name) {
        return { ...c, locked_by: undefined, locked_until: null };
      }
      return c;
    }));

    supabase.from('creators').update({
      locked_by: null,
      locked_until: null,
    }).eq('id', id).then();
  }, [currentUser.name]);

  // Mark contacted
  const markContacted = useCallback(async (id: string, templateType: string, messageBody: string) => {
    const nowStr = new Date().toISOString();

    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        pipeline_status: 'contacted',
        contacted_at: nowStr,
        contacted_by: currentUser.name,
        locked_by: undefined,
        locked_until: null,
      };
    }));

    // Update Daily Stats
    const statKey = `${currentUser.name}_${todayStr}`;
    setDailyStats(prev => ({
      ...prev,
      [statKey]: {
        date: todayStr,
        count: (prev[statKey]?.count || 0) + 1,
      },
    }));

    const targetCreator = creators.find(c => c.id === id);
    addActivity('WhatsApp Terkirim', targetCreator?.username, `Mengirim template ${templateType}`, id);

    // Sync to Supabase
    try {
      await supabase.from('creators').update({
        pipeline_status: 'contacted',
        contacted_at: nowStr,
        contacted_by: currentUser.name,
        locked_by: null,
        locked_until: null,
        updated_at: nowStr,
      }).eq('id', id);

      await supabase.from('messages_log').insert({
        creator_id: id,
        user_name: currentUser.name,
        template_type: templateType,
        message_body: messageBody,
      });
    } catch (e) {
      console.error('Supabase update contacted error', e);
    }
  }, [currentUser.name, todayStr, creators, addActivity]);

  // Undo contacted
  const undoContacted = useCallback(async (id: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        pipeline_status: 'curated',
        contacted_at: null,
        contacted_by: null,
      };
    }));

    const statKey = `${currentUser.name}_${todayStr}`;
    setDailyStats(prev => {
      const cur = prev[statKey]?.count || 0;
      return {
        ...prev,
        [statKey]: {
          date: todayStr,
          count: Math.max(0, cur - 1),
        },
      };
    });

    const targetCreator = creators.find(c => c.id === id);
    addActivity('Undo Contacted', targetCreator?.username, 'Status dikembalikan ke antrean', id);
    toast.info('Status berhasil dikembalikan');

    try {
      await supabase.from('creators').update({
        pipeline_status: 'curated',
        contacted_at: null,
        contacted_by: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.error('Supabase undo error', e);
    }
  }, [currentUser.name, todayStr, creators, addActivity]);

  // Mark refuse
  const markRefuse = useCallback(async (id: string, notes?: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        pipeline_status: 'refuse',
        notes: notes || c.notes,
        locked_by: undefined,
        locked_until: null,
      };
    }));
    const targetCreator = creators.find(c => c.id === id);
    addActivity('Tolak / Refuse', targetCreator?.username, notes || 'Creator menolak tawaran', id);
    toast.error(`@${targetCreator?.username || 'Creator'} ditandai Refuse`);

    try {
      await supabase.from('creators').update({
        pipeline_status: 'refuse',
        notes: notes || targetCreator?.notes,
        locked_by: null,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.error('Supabase refuse error', e);
    }
  }, [creators, addActivity]);

  // Mark invalid phone
  const markInvalidPhone = useCallback(async (id: string) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        pipeline_status: 'invalid_phone',
        phone_status: 'invalid',
        locked_by: undefined,
        locked_until: null,
      };
    }));
    const targetCreator = creators.find(c => c.id === id);
    addActivity('Nomor Tidak Valid', targetCreator?.username, 'Nomor ditandai invalid', id);
    toast.warning(`Nomor @${targetCreator?.username} ditandai tidak valid`);

    try {
      await supabase.from('creators').update({
        pipeline_status: 'invalid_phone',
        phone_status: 'invalid',
        locked_by: null,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.error('Supabase invalid phone error', e);
    }
  }, [creators, addActivity]);

  // Update curation
  const updateCuration = useCallback(async (id: string, curation: CurationStatus, category?: Category) => {
    let newPipeline: PipelineStatus = 'pool';
    if (curation === 'reject') newPipeline = 'refuse';
    else if (curation === 'oke') newPipeline = 'curated';
    else if (curation === 'second_option') newPipeline = 'curated';

    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        curation_status: curation,
        category: category || c.category,
        pipeline_status: newPipeline,
      };
    }));

    try {
      await supabase.from('creators').update({
        curation_status: curation,
        category: category || undefined,
        pipeline_status: newPipeline,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.error('Supabase update curation error', e);
    }
  }, []);

  // Batch update curation
  const batchUpdateCuration = useCallback(async (ids: string[], curation: CurationStatus, category?: Category) => {
    const idSet = new Set(ids);
    setCreators(prev => prev.map(c => {
      if (!idSet.has(c.id)) return c;
      let newPipeline = c.pipeline_status;
      if (curation === 'reject') newPipeline = 'refuse';
      else if (curation === 'oke') newPipeline = 'curated';
      return {
        ...c,
        curation_status: curation,
        category: category || c.category,
        pipeline_status: newPipeline,
      };
    }));
    toast.success(`${ids.length} creator berhasil diupdate`);

    try {
      const updatePayload: any = {
        curation_status: curation,
        updated_at: new Date().toISOString(),
      };
      if (category) updatePayload.category = category;
      if (curation === 'reject') updatePayload.pipeline_status = 'refuse';
      else if (curation === 'oke') updatePayload.pipeline_status = 'curated';

      await supabase.from('creators').update(updatePayload).in('id', ids);
    } catch (e) {
      console.error('Supabase batch curation error', e);
    }
  }, []);

  // Promote second option
  const promoteSecondOption = useCallback(async (id: string, category: Category) => {
    setCreators(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        curation_status: 'oke',
        category,
        pipeline_status: 'curated',
      };
    }));
    const targetCreator = creators.find(c => c.id === id);
    addActivity('Promosi Second Option', targetCreator?.username, `Dipromosikan ke Kategori ${category}`, id);
    toast.success(`@${targetCreator?.username} berhasil dipromosikan ke Kategori ${category}!`);

    try {
      await supabase.from('creators').update({
        curation_status: 'oke',
        category,
        pipeline_status: 'curated',
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (e) {
      console.error('Supabase promote error', e);
    }
  }, [creators, addActivity]);

  // Auto split queue
  const autoSplitQueue = useCallback(async (user1: string, user2: string) => {
    let countU1 = 0;
    let countU2 = 0;
    const updates: { id: string; assigned_to: string }[] = [];

    setCreators(prev => prev.map(c => {
      if (c.curation_status === 'oke' && c.pipeline_status === 'curated' && c.phone_status === 'valid') {
        const assigned = (countU1 <= countU2) ? user1 : user2;
        if (assigned === user1) countU1++; else countU2++;
        updates.push({ id: c.id, assigned_to: assigned });
        return { ...c, assigned_to: assigned };
      }
      return c;
    }));
    toast.success(`Antrean dibagi rata: ${user1} (${countU1}), ${user2} (${countU2})`);

    try {
      for (const u of updates) {
        await supabase.from('creators').update({ assigned_to: u.assigned_to }).eq('id', u.id);
      }
    } catch (e) {
      console.error('Supabase split error', e);
    }
  }, []);

  // Upsert shipment
  const upsertShipment = useCallback(async (shipmentData: Partial<Shipment> & { creator_id: string }) => {
    const nowStr = new Date().toISOString();

    setShipments(prev => {
      const idx = prev.findIndex(s => s.creator_id === shipmentData.creator_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...shipmentData, updated_at: nowStr };
        return updated;
      } else {
        const newShipment: Shipment = {
          id: 'sh-' + Math.random().toString(36).substring(2, 9),
          creator_id: shipmentData.creator_id,
          recipient_name: shipmentData.recipient_name || '',
          recipient_phone: shipmentData.recipient_phone || '',
          address: shipmentData.address || '',
          product: shipmentData.product || 'Dew Theory Product',
          status: shipmentData.status || 'pending',
          tracking_no: shipmentData.tracking_no || '',
          courier: shipmentData.courier || config.default_courier || '',
          created_at: nowStr,
          updated_at: nowStr,
        };
        return [newShipment, ...prev];
      }
    });

    if (shipmentData.status === 'sent') {
      setCreators(prev => prev.map(c => c.id === shipmentData.creator_id ? { ...c, pipeline_status: 'sample_sent' } : c));
    }

    try {
      await supabase.from('shipments').upsert({
        creator_id: shipmentData.creator_id,
        recipient_name: shipmentData.recipient_name,
        recipient_phone: shipmentData.recipient_phone,
        address: shipmentData.address,
        product: shipmentData.product,
        status: shipmentData.status,
        tracking_no: shipmentData.tracking_no,
        courier: shipmentData.courier,
        sent_at: shipmentData.status === 'sent' ? nowStr : undefined,
        updated_at: nowStr,
      }, { onConflict: 'creator_id' });

      if (shipmentData.status === 'sent') {
        await supabase.from('creators').update({ pipeline_status: 'sample_sent' }).eq('id', shipmentData.creator_id);
      }
    } catch (e) {
      console.error('Supabase upsert shipment error', e);
    }
  }, [config.default_courier]);

  // Batch update tracking
  const batchUpdateTracking = useCallback((items: { username: string; tracking_no: string; courier?: string }[]): number => {
    let matchCount = 0;
    items.forEach(item => {
      const cleanUser = item.username.trim().toLowerCase().replace(/^@+/, '');
      const creator = creators.find(c => c.username === cleanUser);
      if (creator) {
        matchCount++;
        upsertShipment({
          creator_id: creator.id,
          tracking_no: item.tracking_no,
          courier: item.courier || config.default_courier || '',
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      }
    });
    return matchCount;
  }, [creators, upsertShipment, config.default_courier]);

  // Upsert SOW
  const upsertSOW = useCallback(async (sowData: Partial<SOWRecord> & { creator_id: string; sow_no: number }) => {
    const nowStr = new Date().toISOString();

    setSows(prev => {
      const idx = prev.findIndex(s => s.creator_id === sowData.creator_id && s.sow_no === sowData.sow_no);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...sowData, updated_at: nowStr };
        return updated;
      } else {
        const newSow: SOWRecord = {
          id: 'sow-' + Math.random().toString(36).substring(2, 9),
          creator_id: sowData.creator_id,
          sow_no: sowData.sow_no,
          link: sowData.link || '',
          posted_at: sowData.posted_at || null,
          status: sowData.link ? 'verified' : 'pending',
          notes: sowData.notes || '',
          created_at: nowStr,
          updated_at: nowStr,
        };
        return [newSow, ...prev];
      }
    });

    // Update creator pipeline status
    setCreators(prev => prev.map(c => {
      if (c.id !== sowData.creator_id) return c;
      if (sowData.sow_no === 2 && sowData.link) return { ...c, pipeline_status: 'sow_2' };
      if (sowData.sow_no === 1 && sowData.link) return { ...c, pipeline_status: 'sow_1' };
      return c;
    }));

    try {
      await supabase.from('sow').upsert({
        creator_id: sowData.creator_id,
        sow_no: sowData.sow_no,
        link: sowData.link,
        posted_at: sowData.posted_at,
        status: sowData.link ? 'verified' : 'pending',
        notes: sowData.notes,
        updated_at: nowStr,
      }, { onConflict: 'creator_id,sow_no' });

      if (sowData.sow_no === 2 && sowData.link) {
        await supabase.from('creators').update({ pipeline_status: 'sow_2' }).eq('id', sowData.creator_id);
      } else if (sowData.sow_no === 1 && sowData.link) {
        await supabase.from('creators').update({ pipeline_status: 'sow_1' }).eq('id', sowData.creator_id);
      }
    } catch (e) {
      console.error('Supabase upsert SOW error', e);
    }
  }, []);

  // Update Template
  const updateTemplate = useCallback(async (id: string, content: string) => {
    const nowStr = new Date().toISOString();
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, content, updated_at: nowStr } : t));
    toast.success('Template pesan berhasil disimpan');

    try {
      await supabase.from('templates').update({ content, updated_at: nowStr }).eq('id', id);
    } catch (e) {
      console.error('Supabase update template error', e);
    }
  }, []);

  // Update Config
  const updateConfig = useCallback(async (newConfig: Partial<AppConfig>) => {
    setConfig(prev => {
      const merged = { ...prev, ...newConfig };
      supabase.from('settings').upsert({
        key: 'app_config',
        value: merged,
        updated_at: new Date().toISOString(),
      }).then();
      return merged;
    });
    toast.success('Pengaturan berhasil diperbarui');
  }, []);

  // Update Campaign
  const updateCampaign = useCallback(async (camp: Partial<Campaign>) => {
    setCampaign(prev => {
      const merged = { ...prev, ...camp };
      supabase.from('campaigns').update(camp).eq('id', prev.id).then();
      return merged;
    });
    toast.success('Target & Timeline kampanye diperbarui');
  }, []);

  // Import Batch
  const importCreatorsBatch = useCallback((
    newCreators: Partial<Creator>[],
    newShipments?: Partial<Shipment>[],
    newSows?: Partial<SOWRecord>[]
  ): { added: number; updated: number } => {
    let added = 0;
    let updated = 0;

    const creatorsMap = new Map<string, Creator>();
    creators.forEach(c => creatorsMap.set(c.username, { ...c }));

    const dbInsertBatch: any[] = [];
    const dbUpdateBatch: any[] = [];

    newCreators.forEach(nc => {
      if (!nc.username) return;
      const u = nc.username.toLowerCase().trim();
      const existing = creatorsMap.get(u);

      if (existing) {
        updated++;
        const preserveStatus = shouldPreserveExistingStatus(existing.pipeline_status, nc.pipeline_status);
        const resolvedPipelineStatus = preserveStatus 
          ? existing.pipeline_status 
          : (nc.pipeline_status || existing.pipeline_status);

        const updatedObj: Creator = {
          ...existing,
          category: (nc.category && nc.category !== 'UNASSIGNED') ? nc.category : existing.category,
          curation_status: nc.curation_status || existing.curation_status,
          pipeline_status: resolvedPipelineStatus,
          phone_raw: nc.phone_raw || existing.phone_raw,
          phone_e164: nc.phone_e164 || existing.phone_e164,
          phone_status: nc.phone_status || existing.phone_status,
          source: nc.source || existing.source,
          updated_at: new Date().toISOString(),
        };
        creatorsMap.set(u, updatedObj);
        dbUpdateBatch.push(updatedObj);
      } else {
        added++;
        const newRecord: Creator = {
          id: 'c-' + Math.random().toString(36).substring(2, 9),
          campaign_id: campaign.id,
          username: u,
          display_name: nc.display_name || u,
          phone_raw: nc.phone_raw || '',
          phone_e164: nc.phone_e164 || '',
          phone_status: nc.phone_status || 'missing',
          platform: nc.platform || 'TikTok',
          source: nc.source || 'Import',
          category: nc.category || 'UNASSIGNED',
          curation_status: nc.curation_status || 'pending',
          pipeline_status: nc.pipeline_status || 'pool',
          notes: nc.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        creatorsMap.set(u, newRecord);
        dbInsertBatch.push(newRecord);
      }
    });

    setCreators(Array.from(creatorsMap.values()));
    addActivity('Import Data', undefined, `Menambahkan ${added} baru, memperbarui ${updated} creator`);

    // Sync to Supabase
    if (dbInsertBatch.length > 0) {
      supabase.from('creators').insert(dbInsertBatch).then();
    }
    if (dbUpdateBatch.length > 0) {
      for (const item of dbUpdateBatch) {
        supabase.from('creators').update(item).eq('id', item.id).then();
      }
    }

    return { added, updated };
  }, [creators, campaign.id, addActivity]);

  const resetToDefaultSeed = useCallback(() => {
    setCampaign(INITIAL_CAMPAIGN);
    setCreators(INITIAL_CREATORS);
    setShipments(INITIAL_SHIPMENTS);
    setSows(INITIAL_SOWS);
    setTemplates(INITIAL_TEMPLATES);
    setConfig(DEFAULT_CONFIG);
    setActivityLogs([]);
    setDailyStats({});
    toast.success('Database direset ke seed default');
  }, []);

  return (
    <AffiliateContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        campaign,
        updateCampaign,
        creators,
        shipments,
        sows,
        templates,
        config,
        activityLogs,
        dailyOutreachCount,
        dailyTarget: 60,
        claimCreator,
        releaseCreator,
        markContacted,
        undoContacted,
        markRefuse,
        markInvalidPhone,
        updateCuration,
        batchUpdateCuration,
        promoteSecondOption,
        autoSplitQueue,
        upsertShipment,
        batchUpdateTracking,
        upsertSOW,
        updateTemplate,
        updateConfig,
        importCreatorsBatch,
        resetToDefaultSeed,
      }}
    >
      {children}
    </AffiliateContext.Provider>
  );
}

export function useAffiliate() {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within an AffiliateProvider');
  }
  return context;
}
