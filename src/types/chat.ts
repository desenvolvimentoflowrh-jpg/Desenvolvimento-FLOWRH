export type ChatChannelType = "direct" | "group";

export interface ChatChannel {
  id: string;
  type: ChatChannelType;
  name?: string;
  sector_id?: string;
  created_at: string;
  participants: string[]; // user emails
  last_message?: ChatMessage;
  unread_count?: number;
  avatar?: string;
  sector_name?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_email: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
}
