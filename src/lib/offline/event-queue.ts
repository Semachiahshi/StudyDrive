export type QueuedEvent = {
  idempotencyKey: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
};

const key = "studydrive-event-queue";

export function enqueueLocalEvent(event: QueuedEvent) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as QueuedEvent[];
  existing.push(event);
  localStorage.setItem(key, JSON.stringify(existing));
}

export function readLocalEvents(): QueuedEvent[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(key) ?? "[]") as QueuedEvent[];
}

export function clearLocalEvents() {
  if (typeof window !== "undefined") localStorage.removeItem(key);
}