import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { resolveTier } from "./tier";

function fakeSupabase(maybeSingleResult: { data: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(maybeSingleResult);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient;
}

describe("resolveTier", () => {
  it("returns gratuit when no abonnements_payants row exists", async () => {
    const supabase = fakeSupabase({ data: null });
    await expect(resolveTier(supabase, "user-1")).resolves.toBe("gratuit");
  });

  it("returns payant when a row exists", async () => {
    const supabase = fakeSupabase({ data: { user_id: "user-1" } });
    await expect(resolveTier(supabase, "user-1")).resolves.toBe("payant");
  });
});
