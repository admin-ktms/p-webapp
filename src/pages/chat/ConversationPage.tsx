
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  MessageCircle,
  ShieldCheck
} from "lucide-react";

import {
  useNavigate,
  useParams,
  useLocation
} from "react-router-dom";

import { chatService } from "../../services/chat.service";
import { useAuth } from "../../app/AuthContext";

import { useConversationMessages } from "../../hooks/chat/useConversationMessages";

import MessageTimeline from "../../components/chat/MessageTimeline";
import MessageComposer from "../../components/chat/MessageComposer";

import type {
  ChatConversation,
  ChatInboxCursor
} from "../../types/chat.types";


function getConversationTitle(
  conversation: ChatConversation | null
): string {
  if (!conversation) return "Conversation";

  if (conversation.conversation_type === "FIXTURE") {
    return (
      conversation.opponent_squad_name ??
      conversation.opponent_player_name ??
      conversation.conversation_display_title ??
      "Fixture conversation"
    );
  }

  if (conversation.conversation_type === "SUPPORT") {
    return (
      conversation.support_case_subject ??
      conversation.conversation_display_title ??
      "Player Support"
    );
  }

  return (
    conversation.conversation_display_title ??
    conversation.tournament_name ??
    "Conversation"
  );
}


function getConversationCategory(
  conversation: ChatConversation | null
): string {
  if (!conversation) return "MESSAGES";

  switch (conversation.conversation_type) {
    case "FIXTURE":
      return conversation.fixture_match_code
        ? `FIXTURE · ${conversation.fixture_match_code}`
        : "FIXTURE CHAT";

    case "SUPPORT":
      return conversation.support_case_id
        ? `SUPPORT · ${conversation.support_case_id}`
        : "PLAYER SUPPORT";

    case "SYSTEM_GLOBAL":
      return "SYSTEM NOTIFICATION";

    case "SYSTEM_TOURNAMENT":
      return "TOURNAMENT NOTIFICATION";

    case "PLAYER":
      return "PLAYER CHAT";

    default:
      return "MESSAGES";
  }
}


function ConversationPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { identity } = useAuth();

  const stateConversation =
    location.state?.conversation as
      | ChatConversation
      | undefined;

  const [resolvedConversation, setResolvedConversation] =
    useState<ChatConversation | null>(
      stateConversation &&
      stateConversation.conversation_id === conversationId
        ? stateConversation
        : null
    );

  useEffect(() => {
    let cancelled = false;

    if (
      stateConversation &&
      stateConversation.conversation_id === conversationId
    ) {
      setResolvedConversation(stateConversation);
      return;
    }

    setResolvedConversation(null);

    async function resolveConversation() {
      let cursor: ChatInboxCursor | null = null;

      try {
        while (!cancelled) {
          const response = await chatService.listInbox({
            limit: 99,
            cursor
          });

          const match = response.conversations.find(
            (item) => item.conversation_id === conversationId
          );

          if (match) {
            setResolvedConversation(match);
            return;
          }

          if (!response.has_more || !response.next_cursor) {
            return;
          }

          cursor = response.next_cursor;
        }
      } catch {
        // Keep conversation unavailable until resolution succeeds.
      }
    }

    void resolveConversation();

    return () => {
      cancelled = true;
    };
  }, [conversationId, stateConversation]);

  const conversation = resolvedConversation;

  const {
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
  } = useConversationMessages(conversationId ?? "");

  if (!conversationId) {
    return null;
  }

  const title = getConversationTitle(conversation);
  const category = getConversationCategory(conversation);

  const isActive =
    conversation?.conversation_status === "ACTIVE";

  const canSend =
    conversation !== null &&
    isActive &&
    (
      conversation.conversation_type === "FIXTURE" ||
      conversation.conversation_type === "SUPPORT" ||
      conversation.conversation_type === "PLAYER"
    );

  return (
    <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border border-white/5 bg-[#050505]">

      {/* Conversation header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#141414] px-3 py-3">

        <button
          type="button"
          onClick={() => navigate("/chats")}
          aria-label="Back to chats"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-300 transition hover:bg-white/5"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
          <MessageCircle size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-white">
            {title}
          </h1>

          <p className="mt-1 truncate text-[9px] font-semibold tracking-wider text-lime-400">
            {category}
          </p>
        </div>

        {conversation?.conversation_type === "FIXTURE" && (
          <ShieldCheck
            size={19}
            className="shrink-0 text-neutral-400"
          />
        )}

      </header>

      {/* Conversation status */}
      {conversation && !isActive && (
        <div className="border-b border-white/5 bg-white/[0.025] px-4 py-2">
          <p className="text-center text-[10px] text-neutral-500">
            This conversation is {conversation.conversation_status.toLowerCase()}.
          </p>
        </div>
      )}

      {/* Message history */}
      <MessageTimeline
        messages={messages}
        currentPlayerId={identity?.player_id ?? null}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        onLoadOlder={loadOlder}
        onRetry={refresh}
      />

      {/* Composer */}
      {canSend ? (
        <MessageComposer
          sending={sending}
          sendError={sendError}
          onSend={sendMessage}
        />
      ) : (
        <div className="shrink-0 border-t border-white/10 bg-[#141414] px-4 py-4">
          <p className="text-center text-xs text-neutral-500">
            {conversation
              ? "Messaging is unavailable for this conversation."
              : "Conversation details are unavailable. Sending is disabled."}
          </p>
        </div>
      )}

    </section>
  );
}

export default ConversationPage;
