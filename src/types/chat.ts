export type ChatChannelType = "direct" | "group";

export interface ChatChannel {
  id: string;
  company_id?: string;
  type: ChatChannelType;
  name?: string;
  sector_id?: string;
  created_at: string;
  participants: string[]; // user emails
  last_message?: ChatMessage;
  unread_count?: number;
  unread_by?: Record<string, number>;
  avatar?: string;
  sector_name?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_email: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  read_by?: string[];
  created_at: string;
}

export interface ChatNotificationToast {
  id: string;
  channelId: string;
  channelName: string;
  channelType: ChatChannelType;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}
