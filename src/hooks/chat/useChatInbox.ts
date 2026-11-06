
import { useCallback, useEffect, useState } from "react";

import { chatService } from "../../services/chat.service";

import { useChatNotifications } from "./ChatNotificationsContext";

import type {
  ChatConversation,
  ChatInboxCursor
} from "../../types/chat.types";

interface UseChatInboxResult {
  conversations: ChatConversation[];
  nextCursor: ChatInboxCursor | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Could not load conversations.";
}

export function useChatInbox(): UseChatInboxResult {
  const [conversations, setConversations] = useState<
    ChatConversation[]
  >([]);

  const [nextCursor, setNextCursor] =
    useState<ChatInboxCursor | null>(null);

  const { lastMessageEvent } = useChatNotifications();

  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await chatService.listInbox({
        limit: 50,
        cursor: null
      });

      setConversations(response.conversations);
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !nextCursor
    ) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await chatService.listInbox({
        limit: 50,
        cursor: nextCursor
      });

      setConversations((current) => {
        const existingIds = new Set(
          current.map((item) => item.conversation_id)
        );

        const additional = response.conversations.filter(
          (item) => !existingIds.has(item.conversation_id)
        );

        return [...current, ...additional];
      });

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loading,
    loadingMore,
    nextCursor
  ]);

  useEffect(() => {
    if (!lastMessageEvent) return;
  
    // Refresh authoritative conversation unread counts.
    void refresh();
  }, [lastMessageEvent, refresh]);
  
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    conversations,
    nextCursor,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore
  };
}
