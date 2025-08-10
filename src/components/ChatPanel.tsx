import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void | Promise<void>;
  loading?: boolean;
}

export function ChatPanel({ messages, onSend, loading }: ChatPanelProps) {
  const [text, setText] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  return (
    <section aria-label="Chat about results" className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Chat about these results</h2>
      <div className="rounded-md border bg-card p-3 max-h-80 overflow-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ask follow-up questions about the table above.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`rounded-lg px-3 py-2 max-w-[75%] text-sm shadow-sm ${m.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                  {m.content}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <Input
          placeholder="Type your question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // allow submit
            }
          }}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </form>
    </section>
  );
}
