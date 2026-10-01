export type TreeStatus = 'PENDING' | 'CONFIRMED';

export interface TreeParticipant {
  id: string;
  user_id: string;
  name: string;
  tree_type: string;
  latitude: number | null;
  longitude: number | null;
  status: TreeStatus;
  post_url: string | null;
  created_at: string;
  confirmed_at: string | null;
}
