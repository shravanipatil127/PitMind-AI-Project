import { useEffect, useRef, useState } from "react";


import type { LiveSnapshot } from "../types";

const WS_URL: string =
  (import.meta as any).env?.VITE_WS_URL || "ws://localhost:8000/ws/live";

type ConnectionState = "connecting" | "open" | "closed" | "error";

export function useLiveRaceSocket(sessionKey?: number) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("closed");

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    shouldReconnect.current = true;

    // No session means there is no live race.
    if (!sessionKey) {
      setSnapshot(null);
      setConnectionState("closed");
      return;
    }

    function connect() {
      setConnectionState("connecting");

      const url = `${WS_URL}?session_key=${sessionKey}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionState("open");
        reconnectAttempt.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LiveSnapshot;
          setSnapshot(data);
        } catch {
          // Ignore malformed frame
        }
      };

      socket.onerror = () => {
        setConnectionState("error");
      };

      socket.onclose = () => {
        setConnectionState("closed");

        if (shouldReconnect.current) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttempt.current,
            15_000
          );

          reconnectAttempt.current += 1;

          setTimeout(() => {
            if (shouldReconnect.current) {
              connect();
            }
          }, delay);
        }
      };
    }

    connect();

    return () => {
      shouldReconnect.current = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [sessionKey]);

  return { snapshot, connectionState };
}