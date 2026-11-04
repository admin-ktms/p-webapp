
export type ConversationType =
  | "SYSTEM_GLOBAL"
  | "SYSTEM_TOURNAMENT"
  | "PLAYER"
  | "SUPPORT"
  | "FIXTURE";

export type ConversationScope =
  | "GLOBAL"
  | "TOURNAMENT";

export type ConversationStatus =
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";

export type MessageSenderType =
  | "PLAYER"
  | "ADMIN"
  | "SYSTEM";

export type MessageType =
  | "TEXT"
  | "SYSTEM_EVENT";

export type SupportCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type SupportCasePriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

export type BigintValue = string | number;

// Inbox pagination cursor.
export interface ChatInboxCursor {
  timestamp: string;
  conversation_id: string;
}

// Exact row returned by notifications.get_my_conversations().
export interface ChatConversation {
  conversation_id: string;

  conversation_type: ConversationType;
  conversation_scope: ConversationScope;
  conversation_status: ConversationStatus;

  created_at: string;
  last_message_at: string | null;

  conversation_display_title: string | null;
  tournament_name: string | null;
  fixture_match_code: string | null;

  latest_message_id: string | null;
  latest_message_body: string | null;
  latest_message_sender_type: MessageSenderType | null;
  latest_message_type: MessageType | null;
  latest_message_created_at: string | null;
  latest_message_edited_at: string | null;
  latest_message_deleted_at: string | null;
  latest_message_metadata: Record<string, unknown> | null;
  latest_message_sender_player_id: string | null;
  latest_message_sender_admin_id: string | null;

  unread_count: BigintValue;
  is_muted: boolean;

  last_read_at: string | null;
  last_read_message_id: string | null;

  counterpart_player_id: string | null;
  counterpart_player_name: string | null;
  counterpart_squad_name: string | null;

  opponent_player_id: string | null;
  opponent_player_name: string | null;
  opponent_squad_name: string | null;

  support_case_id: string | null;
  support_case_subject: string | null;
  support_case_status: SupportCaseStatus | null;
  support_case_priority: SupportCasePriority | null;

  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  support_case_last_activity_at: string | null;

  cursor_timestamp: string;
}

// Inbox operation.
export interface ChatInboxInput {
  limit?: number;
  cursor?: ChatInboxCursor | null;
}

export interface ChatInboxResponse {
  conversations: ChatConversation[];
  next_cursor: ChatInboxCursor | null;
  has_more: boolean;
}

// Exact row returned by notifications.get_conversation_messages().
export interface ChatMessage {
  message_id: string;
  sequence_no: BigintValue;

  sender_type: MessageSenderType;
  sender_player_id: string | null;
  sender_admin_id: string | null;
  sender_name: string | null;

  message_type: MessageType;
  message_body: string | null;
  metadata: Record<string, unknown> | null;

  reply_to_message_id: string | null;

  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

// Message history operation.
export interface ChatMessagesInput {
  conversation_id: string;
  limit?: number;
  before_sequence_no?: string | null;
}

export interface ChatMessagesResponse {
  conversation_id: string;
  messages: ChatMessage[];
  next_cursor: string | null;
  has_more: boolean;
}

// Send message operation.
export interface SendChatMessageInput {
  conversation_id: string;
  body: string;
  idempotency_key: string;
  reply_to_message_id?: string;
}

export interface SendChatMessageResponse {
  message_id: string;
  created: boolean;
}

// Mark conversation read operation.
export interface MarkConversationReadInput {
  conversation_id: string;
  through_message_id?: string;
}

export interface MarkConversationReadResponse {
  conversation_id: string;
  last_read_message_id: string | null;
  receipts_updated: BigintValue;
}

// Create support case operation.
export interface CreateSupportCaseInput {
  subject: string;
  description: string;
  idempotency_key: string;
}

export interface CreateSupportCaseResponse {
  support_case_id: string;
  conversation_id: string;
  initial_message_id: string;
  created: boolean;
}

// Generic chat API error.
export interface ChatError {
  code: string;
  message: string;
}

// Realtime message-created event.
export interface MessageCreatedEvent {
  conversation_id: string;
  message_id: string;
  sequence_no: BigintValue;
  sender_type: MessageSenderType;
  message_type: MessageType;
  created_at: string;
}
