import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent
} from "react";

import {
  LoaderCircle,
  Send
} from "lucide-react";

interface MessageComposerProps {
  disabled?: boolean;
  sending: boolean;
  sendError: string | null;

  onSend: (
    body: string,
    idempotencyKey: string
  ) => Promise<boolean>;
}

function MessageComposer({
  disabled = false,
  sending,
  sendError,
  onSend
}: MessageComposerProps) {
  const [body, setBody] = useState("");

  // Retain the same key when retrying a failed send.
  const idempotencyKeyRef = useRef<string | null>(null);

  const submit = async () => {
    const cleanBody = body.trim();

    if (
      !cleanBody ||
      disabled ||
      sending
    ) {
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        crypto.randomUUID();
    }

    const success = await onSend(
      cleanBody,
      idempotencyKeyRef.current
    );

    if (success) {
      setBody("");
      idempotencyKeyRef.current = null;
    }
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#141414] p-3">
      {sendError && (
        <p
          role="alert"
          className="mb-2 text-xs text-red-300"
        >
          {sendError}
          {" "}Your draft is preserved. Retry to send it.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2"
      >
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          rows={1}
          maxLength={5000}
          placeholder={
            disabled
              ? "Messaging unavailable"
              : "Write a message..."
          }
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-[#222222] px-3 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-lime-400 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={
            disabled ||
            sending ||
            !body.trim()
          }
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <LoaderCircle
              size={19}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      <p className="mt-2 text-[9px] text-neutral-500">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}

export default MessageComposer;
