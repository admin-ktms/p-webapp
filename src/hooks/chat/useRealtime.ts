
import { useEffect, useRef } from "react";

import { supabase } from "../../lib/supabase";
import type { MessageCreatedEvent } from "../../types/chat.types";

export function useChatRealtime(
  playerId: string | null,
  conversationId: string,
  onMessageReceived: () => Promise<void>
) {
  const refreshRef = useRef(onMessageReceived);

  useEffect(() => {
    refreshRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!playerId || !conversationId) return;

    const channel = supabase
      .channel(`player:${playerId}`, {
        config: {
          private: true
        }
      })
      .on(
        "broadcast",
        { event: "message_created" },
        (event: MessageCreatedEvent) => {
          if (
            event.conversation_id !== conversationId
          ) {
            return;
          }

          void refreshRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [playerId, conversationId]);
}
