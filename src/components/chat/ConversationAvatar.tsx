
import {
  Bell,
  Headset,
  MessageCircle,
  Swords,
  Trophy
} from "lucide-react";

import type {
  ConversationType
} from "../../types/chat.types";

interface ConversationAvatarProps {
  type: ConversationType;
  title?: string | null;
}

function getInitials(title: string): string {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";

  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function ConversationAvatar({
  type,
  title
}: ConversationAvatarProps) {
  const common =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full";

  if (type === "SYSTEM_GLOBAL") {
    return (
      <div className={`${common} bg-lime-400/10 text-lime-400`}>
        <Bell size={21} />
      </div>
    );
  }

  if (type === "SYSTEM_TOURNAMENT") {
    return (
      <div className={`${common} bg-amber-400/10 text-amber-400`}>
        <Trophy size={21} />
      </div>
    );
  }

  if (type === "SUPPORT") {
    return (
      <div className={`${common} bg-orange-400/10 text-orange-400`}>
        <Headset size={21} />
      </div>
    );
  }

  if (type === "FIXTURE") {
    return (
      <div className={`${common} bg-blue-400/10 text-blue-400`}>
        <Swords size={21} />
      </div>
    );
  }

  if (type === "PLAYER") {
    return (
      <div className={`${common} bg-violet-400/10 text-violet-400`}>
        <MessageCircle size={21} />
      </div>
    );
  }

  return (
    <div className={`${common} bg-white/10 text-white`}>
      {getInitials(title ?? "?")}
    </div>
  );
}

export default ConversationAvatar;
