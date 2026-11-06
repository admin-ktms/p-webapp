import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { chatService } from "../../services/chat.service";

import type {
  ChatMessage
} from "../../types/chat.types";

interface UseConversationMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  loadingMore: boolean;
  sending: boolean;
  hasMore: boolean;
  error: string | null;
  sendError: string | null;
  loadOlder: () => Promise<void>;
  sendMessage: (
    body: string,
    idempotencyKey: string
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not load conversation messages.";
}

function compareSequence(
  a: ChatMessage,
  b: ChatMessage
): number {
  const first = BigInt(a.sequence_no);
  const second = BigInt(b.sequence_no);

  if (first < second) return -1;
  if (first > second) return 1;

  return 0;
}

function chronological(
  messages: ChatMessage[]
): ChatMessage[] {
  return [...messages].sort(compareSequence);
}

function mergeMessages(
  current: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  const merged = new Map<string, ChatMessage>();

  current.forEach((message) => {
    merged.set(message.message_id, message);
  });

  incoming.forEach((message) => {
    merged.set(message.message_id, message);
  });

  return chronological(Array.from(merged.values()));
}

export function useConversationMessages(
  conversationId: string,
  onConversationRead?: () => Promise<void>
): UseConversationMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const requestVersion = useRef(0);
  const sendingRef = useRef(false);

  const markRead = useCallback(
    async (messageId: string | undefined) => {
      if (!messageId) return;

      try {
        await chatService.markConversationRead({
          conversation_id: conversationId,
          through_message_id: messageId
        });
      
        await onConversationRead?.();
      } catch {
        // Reading can be retried on the next refresh.
      }
    },
    [conversationId, onConversationRead]
  );

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;

    setLoading(true);
    setError(null);

    try {
      const response = await chatService.listMessages({
        conversation_id: conversationId,
        limit: 50
      });

      if (version !== requestVersion.current) return;

      // API returns newest messages first.
      const ordered = chronological(response.messages);

      setMessages((current) =>
        mergeMessages(current, ordered)
      );

      setCursor(response.next_cursor);
      setHasMore(response.has_more);

      // response.messages[0] is the newest message.
      await markRead(
        response.messages[0]?.message_id
      );
    } catch (err) {
      if (version === requestVersion.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [conversationId, markRead]);

  const loadOlder = useCallback(async () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !cursor
    ) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await chatService.listMessages({
        conversation_id: conversationId,
        limit: 50,
        before_sequence_no: cursor
      });

      const olderMessages = chronological(
        response.messages
      );

      setMessages((current) =>
        mergeMessages(current, olderMessages)
      );

      setCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }, [
    conversationId,
    cursor,
    hasMore,
    loading,
    loadingMore
  ]);

  const sendMessage = useCallback(
    async (
      body: string,
      idempotencyKey: string
    ): Promise<boolean> => {
      const cleanBody = body.trim();

      if (
        !cleanBody ||
        !idempotencyKey ||
        sendingRef.current
      ) {
        return false;
      }

      sendingRef.current = true;
      setSending(true);
      setSendError(null);

      try {
        await chatService.sendMessage({
          conversation_id: conversationId,
          body: cleanBody,
          idempotency_key: idempotencyKey
        });

        // The send response contains only message_id
        // and created. Fetch the authoritative message.
        const response = await chatService.listMessages({
          conversation_id: conversationId,
          limit: 50
        });

        const ordered = chronological(response.messages);

        setMessages((current) =>
          mergeMessages(current, ordered)
        );

        setCursor(response.next_cursor);
        setHasMore(response.has_more);

        await markRead(
          response.messages[0]?.message_id
        );

        return true;
      } catch (err) {
        setSendError(getErrorMessage(err));
        return false;
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [conversationId, markRead]
  );

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(false);

    void refresh();

    return () => {
      requestVersion.current += 1;
    };
  }, [conversationId, refresh]);

  return {
    messages,
    loading,
    loadingMore,
    sending,
    hasMore,
    error,
    sendError,
    loadOlder,
    sendMessage,
    refresh
  };
}
