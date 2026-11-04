
function ChatLoadingState() {
  return (
    <div
      className="space-y-1"
      aria-label="Loading conversations"
      role="status"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-white/5 px-4 py-4"
        >
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white/10" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />

            <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />

            <div className="h-2.5 w-4/5 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}

      <span className="sr-only">
        Loading conversations...
      </span>
    </div>
  );
}

export default ChatLoadingState;
