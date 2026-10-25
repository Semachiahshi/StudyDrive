export type ActionState = { ok: true; at: number } | { ok: false; error: string; at: number } | null;

export function ok(): ActionState {
  return { ok: true, at: Date.now() };
}

export function fail(error: string): ActionState {
  return { ok: false, error, at: Date.now() };
}

export type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;
