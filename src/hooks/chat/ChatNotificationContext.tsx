
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";

import { supabase } from "../../lib/supabase";
import { chatService } from "../../services/chat.service";

import type {
  MessageCreatedEvent
} from "../../types/chat.types";

interface ChatNotificationsValue {
  unreadCount: number;
  lastMessageEvent: MessageCreatedEvent | null;
  refreshUnreadCount: () => Promise<void>;
}

const ChatNotificationsContext =
  createContext<ChatNotificationsValue | null>(null);

interface ProviderProps {
  playerId: string | null;
  children: ReactNode;
}

export function ChatNotificationsProvider({
  playerId,
  children
}: ProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const [lastMessageEvent, setLastMessageEvent] =
    useState<MessageCreatedEvent | null>(null);

  const requestVersion = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!playerId) {
      setUnreadCount(0);
      return;
    }

    const version = ++requestVersion.current;

    try {
      const response = await chatService.getUnreadCount();

      if (version !== requestVersion.current) return;

      const count = Number(response.unread_count);

      if (Number.isSafeInteger(count) && count >= 0) {
        setUnreadCount(count);
      }
    } catch {
      // Keep the last confirmed count.
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) {
      requestVersion.current += 1;
      setUnreadCount(0);
      setLastMessageEvent(null);
      return;
    }

    void refreshUnreadCount();

    const channel = supabase
      .channel(`player:${playerId}`, {
        config: {
          private: true
        }
      })
      .on(
        "broadcast",
        { event: "message_created" },
        (broadcast) => {
          const event =
            broadcast.payload as MessageCreatedEvent;

          if (
            !event ||
            typeof event.conversation_id !== "string" ||
            typeof event.message_id !== "string"
          ) {
            return;
          }

          setLastMessageEvent(event);

          // Fetch the authoritative global count.
          void refreshUnreadCount();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Reconcile after initial connection or reconnect.
          void refreshUnreadCount();
        }
      });

    return () => {
      requestVersion.current += 1;
      void supabase.removeChannel(channel);
    };
  }, [playerId, refreshUnreadCount]);

  return (
    <ChatNotificationsContext.Provider
      value={{
        unreadCount,
        lastMessageEvent,
        refreshUnreadCount
      }}
    >
      {children}
    </ChatNotificationsContext.Provider>
  );
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationsContext);

  if (!context) {
    throw new Error(
      "useChatNotifications must be used inside ChatNotificationsProvider."
    );
  }

  return context;
}
