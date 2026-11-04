
import { Link } from "react-router-dom";

import ConversationAvatar from "./ConversationAvatar";

import type {
  ChatConversation
} from "../../types/chat.types";

interface ConversationRowProps {
  conversation: ChatConversation;
}

function getTitle(
  conversation: ChatConversation
): string {
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

function getCategory(
  conversation: ChatConversation
): string {
  switch (conversation.conversation_type) {
    case "SYSTEM_GLOBAL":
      return "System notification";

    case "SYSTEM_TOURNAMENT":
      return conversation.tournament_name
        ? `Tournament · ${conversation.tournament_name}`
        : "Tournament notification";

    case "FIXTURE":
      return conversation.fixture_match_code
        ? `Fixture · ${conversation.fixture_match_code}`
        : "Fixture conversation";

    case "SUPPORT":
      return conversation.support_case_id
        ? `Support · ${conversation.support_case_id}`
        : "Player Support";

    case "PLAYER":
      return (
        conversation.counterpart_squad_name ??
        conversation.counterpart_player_name ??
        "Player conversation"
      );
  }
}

function getPreview(
  conversation: ChatConversation
): string {
  if (conversation.latest_message_deleted_at) {
    return "This message was deleted.";
  }

  if (!conversation.latest_message_id) {
    return "No messages yet.";
  }

  if (conversation.latest_message_type === "SYSTEM_EVENT") {
    return (
      conversation.latest_message_body ??
      "A system update occurred."
    );
  }

  return (
    conversation.latest_message_body ??
    "Message unavailable."
  );
}

function formatTimestamp(
  value: string | null
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short"
  });
}

function ConversationRow({
  conversation
}: ConversationRowProps) {
  const title = getTitle(conversation);
  const category = getCategory(conversation);

  const unreadCount =
    Number(conversation.unread_count) || 0;

  const preview = getPreview(conversation);

  const timestamp = formatTimestamp(
    conversation.last_message_at ??
    conversation.created_at
  );

  const isClosed =
    conversation.conversation_status !== "ACTIVE";

  return (
    <Link
      to={`/chats/${encodeURIComponent(
        conversation.conversation_id
      )}`}
      state={{ conversation }}
      className="flex items-center gap-3 border-b border-white/5 px-4 py-4 transition hover:bg-white/[0.035]"
      aria-label={`Open conversation with ${title}`}
    >
      <ConversationAvatar
        type={conversation.conversation_type}
        title={title}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-white">
            {title}
          </h3>

          <span className="shrink-0 text-[10px] text-neutral-500">
            {timestamp}
          </span>
        </div>

        <p className="mt-1 truncate text-[11px] text-lime-400/80">
          {category}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-neutral-400">
            {preview}
          </p>

          {unreadCount > 0 && (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-lime-400 px-1.5 text-[10px] font-bold text-black"
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {isClosed && (
          <span className="mt-1 inline-block text-[10px] text-neutral-500">
            {conversation.conversation_status}
          </span>
        )}

        {conversation.is_muted && (
          <span className="mt-1 inline-block pl-2 text-[10px] text-neutral-500">
            Muted
          </span>
        )}
      </div>
    </Link>
  );
}

export default ConversationRow;
