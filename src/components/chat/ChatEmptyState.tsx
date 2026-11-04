
import { MessageCircle } from "lucide-react";

function ChatEmptyState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10 text-lime-400">
        <MessageCircle size={30} />
      </div>

      <h2 className="mt-5 text-lg font-bold text-white">
        No conversations yet
      </h2>

      <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-400">
        Your fixture discussions, tournament notifications
        and support conversations will appear here.
      </p>
    </div>
  );
}

export default ChatEmptyState;
