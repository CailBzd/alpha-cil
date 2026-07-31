import { vi } from "vitest";

interface FakeSupabaseOptions {
  signUp?: {
    data: { user: { id: string } | null };
    error: { code?: string; message: string } | null;
  };
  insertError?: { message: string } | null;
  rpcResults?: Record<string, { data: unknown; error: { message: string } | null }>;
}

export function createFakeSupabase(opts: FakeSupabaseOptions = {}) {
  const signUp = vi.fn().mockResolvedValue(
    opts.signUp ?? { data: { user: { id: "user-1" } }, error: null },
  );
  const insert = vi.fn().mockResolvedValue({ error: opts.insertError ?? null });
  const from = vi.fn(() => ({ insert }));
  const rpc = vi.fn((fnName: string) =>
    Promise.resolve(opts.rpcResults?.[fnName] ?? { data: null, error: null }),
  );

  return { auth: { signUp }, from, rpc, __mocks: { signUp, insert, from, rpc } };
}

export function mockCookies() {
  return vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
  }));
}
