import { Info } from "lucide-react";

import type {
  ChatMessage
} from "../../types/chat.types";

interface SystemMessageProps {
  message: ChatMessage;
}

function SystemMessage({
  message
}: SystemMessageProps) {
  const deleted = Boolean(message.deleted_at);

  const body = deleted
    ? "System message unavailable."
    : message.message_body ?? "A system event occurred.";

  return (
    <div className="flex justify-center px-4 py-2">
      <div className="flex max-w-[90%] items-start gap-2 rounded-xl border border-white/5 bg-[#141414] px-3 py-2">
        <Info
          size={14}
          className="mt-0.5 shrink-0 text-lime-400"
        />

        <div>
          <p className="text-center text-xs leading-relaxed text-neutral-300">
            {body}
          </p>

          <p className="mt-1 text-center text-[9px] text-neutral-500">
            {new Date(message.created_at).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit"
              }
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SystemMessage;
