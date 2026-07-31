import { createServerSupabaseClient } from "@alpha-cil/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, mockCookies } from "../../../../test/supabase-mock";
import { POST } from "./route";

vi.mock("next/headers", () => ({ cookies: mockCookies() }));
vi.mock("@alpha-cil/db", () => ({ createServerSupabaseClient: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/proprietaire/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = { email: "owner@example.com", password: "hunter2hunter2" };

describe("POST /api/proprietaire/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request missing email/password", async () => {
    const response = await POST(request({ email: "a@b.com" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });

  it("maps a duplicate email to 409 email_taken", async () => {
    const supabase = createFakeSupabase({
      signUp: { data: { user: null }, error: { code: "user_already_exists", message: "already registered" } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "email_taken" });
  });

  it("succeeds with no token and never calls claim_logement_invitation", async () => {
    const supabase = createFakeSupabase();
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("claims the invitation token after a successful signup, without ever invalidating the new account on claim failure", async () => {
    const supabase = createFakeSupabase({
      rpcResults: { claim_logement_invitation: { data: null, error: { message: "expired" } } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request({ ...validBody, token: "some-token" }));

    expect(supabase.rpc).toHaveBeenCalledWith("claim_logement_invitation", {
      invitation_token: "some-token",
    });
    // The account still succeeds even though the claim itself failed.
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });
});
