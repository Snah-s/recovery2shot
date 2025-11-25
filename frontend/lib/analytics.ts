// frontend/lib/analytics.ts
import { v4 as uuidv4 } from "uuid";

const BACKEND_URL = "http://localhost:8000";

let sessionId: string | null = null;

function getSessionId() {
  if (typeof window === "undefined") return "unknown";
  if (!sessionId) {
    sessionId = localStorage.getItem("r2s_session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("r2s_session_id", sessionId);
    }
  }
  return sessionId;
}

export function trackEvent(event_type: string, data: Record<string, any>) {
  if (typeof window === "undefined") return;

  const payload = {
    event_type,
    session_id: getSessionId(),
    timestamp: Date.now(),
    data,
  };

  try {
    navigator.sendBeacon?.(
      `${BACKEND_URL}/metrics`,
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
  } catch (e) {
    fetch(`${BACKEND_URL}/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }
}
