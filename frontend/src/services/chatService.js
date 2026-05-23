import { resolveApiUrl } from "@/lib/api-contract";

// frontend/src/services/chatService.js
// Sends a message to /api/chat and returns { reply, itinerary }.

/**
 * Send a chat message to the AI backend.
 * @param {string} message - User's message
 * @param {Array}  history - Previous messages [{role, content}]
 * @returns {Promise<{ reply: string, itinerary: object|null }>}
 */
export async function sendChatMessage(message, history = []) {
  const res = await fetch(resolveApiUrl("/api/chat"), {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Chat API error ${res.status}`);
  }

  const data = await res.json();
  return {
    reply:     data.reply     || "",
    itinerary: data.itinerary || null,
  };
}
