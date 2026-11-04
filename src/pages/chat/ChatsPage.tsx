
import { RefreshCw } from "lucide-react";

import { useChatInbox } from "../../hooks/chat/useChatInbox";
import ConversationRow from "../../components/chat/ConversationRow";
import ChatEmptyState from "../../components/chat/ChatEmptyState";
import ChatLoadingState from "../../components/chat/ChatLoadingState";

function ChatsPage() {
  const {
    conversations,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore
  } = useChatInbox();

  return (
    <main className="min-h-full">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Chats
          </h1>

          <p className="mt-1 text-xs text-neutral-400">
            Your conversations and notifications
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh conversations"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-neutral-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3"
        >
          <p className="text-sm text-red-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 text-xs font-semibold text-lime-400"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <ChatLoadingState />
      ) : error && conversations.length === 0 ? (
        null
      ) : conversations.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <section aria-label="Conversations">
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.conversation_id}
              conversation={conversation}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center px-4 py-5">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold text-lime-400 transition hover:bg-white/5 disabled:opacity-50"
              >
                {loadingMore
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default ChatsPage;
