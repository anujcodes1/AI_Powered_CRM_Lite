export type DealStage = 'lead' | 'contacted' | 'proposal' | 'won' | 'lost';

export type ActivityType = 'call' | 'email' | 'meeting' | 'status_change';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
  lead_score?: number;
  ai_score_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreateInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tags: string[];
}

export interface ContactUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string[];
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  stage: DealStage;
  value: number;
  contact?: Contact;
  created_at: string;
  updated_at: string;
}

export interface DealCreateInput {
  title: string;
  contact_id: string;
  stage: DealStage;
  value: number;
}

export interface DealUpdateInput {
  title?: string;
  contact_id?: string;
  stage?: DealStage;
  value?: number;
}

export interface Note {
  id: string;
  user_id: string;
  contact_id: string;
  content: string;
  created_at: string;
}

export interface NoteCreateInput {
  content: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  contact_id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
