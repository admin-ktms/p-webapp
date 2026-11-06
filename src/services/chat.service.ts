
import { callApi } from "../lib/api";

import type {
  ChatInboxInput,
  ChatInboxResponse,
  ChatMessagesInput,
  ChatMessagesResponse,
  SendChatMessageInput,
  SendChatMessageResponse,
  ChatUnreadCountResponse,
  MarkConversationReadInput,
  MarkConversationReadResponse,
  CreateSupportCaseInput,
  CreateSupportCaseResponse
} from "../types/chat.types";

export const chatService = {
  async listInbox(
    input: ChatInboxInput = {}
  ): Promise<ChatInboxResponse> {
    return callApi<ChatInboxResponse>(
      "chat.inbox.list",
      { ...input }
    );
  },

  
  async getUnreadCount(): Promise<ChatUnreadCountResponse> {
    return callApi<ChatUnreadCountResponse>(
      "chat.unread.count",
      {}
    );
  },

  async listMessages(
    input: ChatMessagesInput
  ): Promise<ChatMessagesResponse> {
    return callApi<ChatMessagesResponse>(
      "chat.conversation.messages.list",
      { ...input }
    );
  },

  async sendMessage(
    input: SendChatMessageInput
  ): Promise<SendChatMessageResponse> {
    return callApi<SendChatMessageResponse>(
      "chat.message.send",
      { ...input }
    );
  },

  async markConversationRead(
    input: MarkConversationReadInput
  ): Promise<MarkConversationReadResponse> {
    return callApi<MarkConversationReadResponse>(
      "chat.conversation.read",
      { ...input }
    );
  },

  async createSupportCase(
    input: CreateSupportCaseInput
  ): Promise<CreateSupportCaseResponse> {
    return callApi<CreateSupportCaseResponse>(
      "chat.support.create",
      { ...input }
    );
  }
};
