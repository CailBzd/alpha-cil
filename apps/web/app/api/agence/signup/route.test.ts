import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifySiret } from "@alpha-cil/intervention";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, mockCookies } from "../../../../test/supabase-mock";
import { POST } from "./route";

vi.mock("next/headers", () => ({ cookies: mockCookies() }));
vi.mock("@alpha-cil/db", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("@alpha-cil/intervention", () => ({ verifySiret: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/agence/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: "agence@example.com",
  password: "hunter2hunter2",
  siret: "12345678900012",
  token: "invite-token",
};

describe("POST /api/agence/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request with no invitation token — agency accounts are never self-serve", async () => {
    const response = await POST(request({ email: "a@b.com", password: "x", siret: "12345678900012" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(verifySiret).not.toHaveBeenCalled();
  });

  it("rejects a confirmed-bad SIRET before ever calling signUp", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "introuvable" });
    const supabase = createFakeSupabase();
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "siret_invalide" });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("maps a duplicate email to 409 email_taken", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Agence SARL" });
    const supabase = createFakeSupabase({
      signUp: { data: { user: null }, error: { code: "user_already_exists", message: "already registered" } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "email_taken" });
  });

  it("reports signup_failed when the post-signUp agences insert fails", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Agence SARL" });
    const supabase = createFakeSupabase({ insertError: { message: "constraint violation" } });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "signup_failed" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("reports claimed:false when the account is created but the grant claim itself fails", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Agence SARL" });
    const supabase = createFakeSupabase({
      rpcResults: { claim_agence_grant: { data: "expired_or_revoked", error: null } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, claimed: false });
  });

  it("succeeds end to end and reports claimed:true on a successful grant claim", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Agence SARL" });
    const supabase = createFakeSupabase({
      rpcResults: { claim_agence_grant: { data: "success", error: null } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, claimed: true });
    expect(supabase.rpc).toHaveBeenCalledWith("claim_agence_grant", { p_token: "invite-token" });
  });
});
