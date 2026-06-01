import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { coachChat } from "@/lib/api/coach.functions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const OPENING: Msg = {
  role: "assistant",
  content:
    "Hey! I'm your AI transformation coach. I know your situation — strong skills, no job yet, and 30 days to change that. Today is Day 1 of your transformation. How are you feeling? Let's make it count.",
};

const QUICK = [
  { label: "I feel demotivated today 😞", prompt: "I feel demotivated today. Help me get started on my routine." },
  { label: "Got rejected 💔", prompt: "I got rejected from a job application today. What should I do to stay on track?" },
  { label: "Pep talk 🔥", prompt: "Give me a strong motivational pep talk for today based on my goals." },
  { label: "Crushed it today 🎉", prompt: "I completed all 15 goals today. Celebrate with me and tell me what to prioritise tomorrow." },
  { label: "Networking tips 🔗", prompt: "Give me specific tips to improve my LinkedIn networking strategy this week." },
  { label: "Weekly review 📊", prompt: "Help me do a quick review of my week. What should I focus on most next week?" },
];

export function CoachTab() {
  const [messages, setMessages] = useState<Msg[]>([OPENING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chat = useServerFn(coachChat);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply || "(no response)" }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to reach coach";
      toast.error(msg);
      setMessages(next);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <div>
        <h1 className="text-2xl font-bold">AI Coach</h1>
        <p className="text-sm text-muted-foreground">Always-on accountability partner. Honest, specific, in your corner.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto card-soft p-4 mt-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border bg-card px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm border bg-card px-4 py-3 flex gap-1">
              <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => send(q.prompt)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask your coach anything…"
          rows={2}
          className="flex-1 resize-none rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-primary text-primary-foreground px-4 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 rounded-full bg-muted-foreground animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
