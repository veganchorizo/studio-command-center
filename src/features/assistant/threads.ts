import type { AssistantThread, ChatMessage } from "@/features/data/entities";

export function newThread(model: string): AssistantThread {
  return {
    id: `TH-${Date.now().toString(36).toUpperCase()}`,
    title: "New conversation",
    model,
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

export function message(role: ChatMessage["role"], content: string, sources?: string[]): ChatMessage {
  return {
    id: `M-${Math.random().toString(36).slice(2, 10)}`,
    role,
    content,
    ...(sources?.length ? { sources } : {}),
  };
}

export function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "New conversation";
}
