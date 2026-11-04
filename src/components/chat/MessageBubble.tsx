import { Check, CheckCheck } from "lucide-react";

import type {
  ChatMessage
} from "../../types/chat.types";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function MessageBubble({
  message,
  isOwn
}: MessageBubbleProps) {
  const deleted = Boolean(message.deleted_at);

  const body = deleted
    ? "This message was deleted."
    : message.message_body ?? "";

  return (
    <div
      className={`flex w-full ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <article
        className={`max-w-[82%] rounded-2xl px-3 py-2 ${
          isOwn
            ? "rounded-br-sm bg-lime-400 text-black"
            : "rounded-bl-sm border border-white/5 bg-[#222222] text-white"
        }`}
      >
        {!isOwn && message.sender_name && (
          <p className="mb-1 text-[10px] font-semibold text-lime-400">
            {message.sender_name}
          </p>
        )}

        <p
          className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
            deleted ? "italic opacity-60" : ""
          }`}
        >
          {body}
        </p>

        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
            isOwn ? "text-black/60" : "text-neutral-500"
          }`}
        >
          <span>{formatTime(message.created_at)}</span>

          {isOwn && (
            <Check size={12} aria-label="Sent" />
          )}
        </div>
      </article>
    </div>
  );
}

export default MessageBubble;
