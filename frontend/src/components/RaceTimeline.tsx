import { Flag } from "lucide-react";

interface RaceControlMessage {
  date?: string;
  category?: string;
  message?: string;
  flag?: string;
}

export default function RaceTimeline({ messages }: { messages: RaceControlMessage[] }) {
  const sorted = [...messages].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15);

  if (sorted.length === 0) {
    return <p className="text-pit-muted text-sm py-6 text-center">No race control messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((msg, idx) => (
        <div key={idx} className="flex gap-3 items-start">
          <Flag size={14} className="mt-1 text-pit-red shrink-0" />
          <div>
            <p className="text-sm">{msg.message || "—"}</p>
            <p className="text-xs text-pit-muted">
              {msg.category} {msg.date ? `· ${new Date(msg.date).toLocaleTimeString()}` : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
