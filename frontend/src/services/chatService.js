// frontend/src/services/chatService.js
// Sends a message to /api/chat and returns { reply, itinerary }.

/**
 * Send a chat message to the AI backend.
 * @param {string} message - User's message
 * @param {Array}  history - Previous messages [{role, content}]
 * @param {"general"|"planner"} mode - AI mode
 * @returns {Promise<{ reply: string, itinerary: object|null }>}
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function sendChatMessage(message, history = [], mode = "general") {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message, history, mode }),
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
