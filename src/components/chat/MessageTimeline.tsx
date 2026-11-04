import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef
} from "react";

import { ChevronUp, LoaderCircle } from "lucide-react";

import MessageBubble from "./MessageBubble";
import SystemMessage from "./SystemMessage";

import type {
  ChatMessage
} from "../../types/chat.types";

interface MessageTimelineProps {
  messages: ChatMessage[];
  currentPlayerId: string | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadOlder: () => Promise<void>;
  onRetry: () => Promise<void>;
}

function MessageTimeline({
  messages,
  currentPlayerId,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadOlder,
  onRetry
}: MessageTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);
  const previousHeightRef = useRef(0);
  const previousLastIdRef = useRef<string | null>(null);
  const previousCountRef = useRef(0);
  const nearBottomRef = useRef(true);

  const loadOlder = useCallback(async () => {
    const container = containerRef.current;

    if (
      !container ||
      loadingOlderRef.current ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    loadingOlderRef.current = true;
    previousHeightRef.current = container.scrollHeight;

    try {
      await onLoadOlder();
    } finally {
      requestAnimationFrame(() => {
        const element = containerRef.current;

        if (element) {
          element.scrollTop +=
            element.scrollHeight - previousHeightRef.current;
        }

        loadingOlderRef.current = false;
      });
    }
  }, [hasMore, loadingMore, onLoadOlder]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || loading) return;

    const previousLast = previousLastIdRef.current;
    const currentLast = messages[messages.length - 1]?.message_id;

    const isNewMessage =
      currentLast !== undefined &&
      currentLast !== previousLast;

    if (
      !loadingOlderRef.current &&
      isNewMessage &&
      nearBottomRef.current
    ) {
      container.scrollTop = container.scrollHeight;
    }

    if (previousCountRef.current === 0 && messages.length > 0) {
      container.scrollTop = container.scrollHeight;
    }

    previousLastIdRef.current = currentLast ?? null;
    previousCountRef.current = messages.length;
  }, [messages, loading]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [loading]);

  const handleScroll = () => {
    const container = containerRef.current;

    if (!container) return;

    nearBottomRef.current =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight < 100;

    if (container.scrollTop < 40) {
      void loadOlder();
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoaderCircle
          size={24}
          className="animate-spin text-lime-400"
        />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm text-red-300">{error}</p>

        <button
          type="button"
          onClick={() => void onRetry()}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-lime-400"
        >
          Retry
        </button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 text-center">
        <p className="text-sm text-neutral-500">
          No messages in this conversation yet.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-3 overflow-y-auto px-3 py-4"
      aria-label="Conversation messages"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {hasMore && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => void loadOlder()}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-neutral-400 disabled:opacity-50"
          >
            {loadingMore ? (
              <LoaderCircle
                size={13}
                className="animate-spin"
              />
            ) : (
              <ChevronUp size={13} />
            )}

            Older messages
          </button>
        </div>
      )}

      {messages.map((message) => {
        if (message.message_type === "SYSTEM_EVENT") {
          return (
            <SystemMessage
              key={message.message_id}
              message={message}
            />
          );
        }

        const isOwn =
          message.sender_type === "PLAYER" &&
          message.sender_player_id !== null &&
          message.sender_player_id === currentPlayerId;

        return (
          <MessageBubble
            key={message.message_id}
            message={message}
            isOwn={isOwn}
          />
        );
      })}
    </div>
  );
}

export default MessageTimeline;
