import { Bot, Send, User } from "lucide-react";
import { useState } from "react";

import { api } from "../api/client";
import type { ChatMessage, ChatResponse } from "../types";

export default function ChatPanel({ sessionKey }: { sessionKey?: number }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I'm PitMind AI, your race engineer. Ask me about tyres, pit windows, or who's likely to win.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = (await api.chat({
        session_key: sessionKey,
        messages: nextMessages,
      })) as ChatResponse;

      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
      setSuggestions(response.suggestions || []);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "I couldn't reach the race data service just now — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-pit-red/15 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-pit-red" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-pit-red text-white rounded-br-sm"
                  : "bg-white/5 border border-pit-border rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-xs text-pit-muted pl-10">PitMind AI is thinking…</p>}
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-pit-border text-pit-muted hover:text-pit-text hover:border-pit-red/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-pit-border flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about strategy, tyres, or the win probability…"
          className="flex-1 bg-white/5 border border-pit-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pit-red/50"
        />
        <button
          onClick={() => send(input)}
          disabled={loading}
          className="p-2.5 rounded-xl bg-pit-red text-white disabled:opacity-50 hover:bg-pit-redDark transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
