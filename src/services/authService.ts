import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const ensureAnonymousUser = async (): Promise<User> => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Không thể kiểm tra phiên đăng nhập: ${sessionError.message}`);
  if (sessionData.session?.user) return sessionData.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`Không thể tạo phiên ẩn danh: ${error?.message ?? 'Không nhận được người dùng.'}`);
  }
  return data.user;
};
