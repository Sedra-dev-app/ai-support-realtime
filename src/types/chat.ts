export interface Message {
  id?: string;
  conversation_id?: string;
  sender: 'visitor' | 'ai' | 'agent';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  visitor_name: string;
  status: 'ai' | 'human_requested' | 'human_active' | 'closed';
  created_at: string;
}