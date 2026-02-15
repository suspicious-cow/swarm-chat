export interface Session {
  id: string;
  title: string;
  status: 'waiting' | 'active' | 'completed';
  join_code: string;
  subgroup_size: number;
  user_count?: number;
  subgroup_count?: number;
  created_at: string;
}

export interface User {
  id: string;
  display_name: string;
  session_id: string;
  subgroup_id: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Subgroup {
  id: string;
  session_id: string;
  label: string;
  members: User[];
  created_at: string;
}

export interface Message {
  id: string;
  subgroup_id: string;
  user_id: string | null;
  display_name: string | null;
  content: string;
  msg_type: 'human' | 'surrogate' | 'contributor';
  source_subgroup_id: string | null;
  created_at: string;
}

export interface Idea {
  id: string;
  session_id: string;
  subgroup_id: string;
  summary: string;
  sentiment: number;
  support_count: number;
  challenge_count: number;
  created_at: string;
}

export interface Account {
  id: string;
  username: string;
  display_name: string;
  is_server_admin: boolean;
  totp_enabled: boolean;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WSEvent {
  event: string;
  data: Record<string, unknown>;
}
