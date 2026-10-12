import ChatPanel from "../components/ChatPanel";
import { useLatestSession } from "../hooks/useRaceData";

export default function AIChat() {
  const { data: session } = useLatestSession();

  return (
    <div className="max-w-3xl mx-auto">
      <ChatPanel sessionKey={session?.session_key} />
    </div>
  );
}
