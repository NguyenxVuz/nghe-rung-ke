import { supabase } from '../lib/supabase';
import { ensureAnonymousUser } from './authService';
import type { TreeParticipant } from '../types/tree';

const publicTreeFields = 'id,user_id,name,tree_type,latitude,longitude,status,post_url,created_at,confirmed_at';
const mapTreeFields = 'id,user_id,name,tree_type,latitude,longitude,status,created_at,confirmed_at';

export const createTree = async (input: {
  name: string;
  treeType: string;
  latitude: number;
  longitude: number;
}): Promise<TreeParticipant> => {
  const user = await ensureAnonymousUser();
  const { data, error } = await supabase
    .from('tree_participants')
    .insert({
      user_id: user.id,
      name: input.name,
      tree_type: input.treeType,
      latitude: input.latitude,
      longitude: input.longitude,
      status: 'PENDING',
    })
    .select(publicTreeFields)
    .single();

  if (error || !data) throw new Error(`Không thể gieo mầm cây: ${error?.message ?? 'Không nhận được dữ liệu.'}`);
  return data as TreeParticipant;
};

export const confirmTree = async (treeId: string, postUrl: string): Promise<TreeParticipant> => {
  const { data, error } = await supabase
    .from('tree_participants')
    .update({ status: 'CONFIRMED', post_url: postUrl, confirmed_at: new Date().toISOString() })
    .eq('id', treeId)
    .select(publicTreeFields)
    .single();

  if (error || !data) throw new Error(`Không thể xác nhận mầm cây: ${error?.message ?? 'Không nhận được dữ liệu.'}`);
  return data as TreeParticipant;
};

export const getConfirmedTrees = async (): Promise<TreeParticipant[]> => {
  const { data, error } = await supabase
    .from('tree_participants')
    .select(mapTreeFields)
    .eq('status', 'CONFIRMED')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Không thể tải bản đồ mầm xanh: ${error.message}`);
  return (data ?? []) as TreeParticipant[];
};
