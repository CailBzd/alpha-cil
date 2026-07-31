import { createServerSupabaseClient } from "@alpha-cil/db";
import { verifySiret } from "@alpha-cil/intervention";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeSupabase, mockCookies } from "../../../../test/supabase-mock";
import { POST } from "./route";

vi.mock("next/headers", () => ({ cookies: mockCookies() }));
vi.mock("@alpha-cil/db", () => ({ createServerSupabaseClient: vi.fn() }));
vi.mock("@alpha-cil/intervention", () => ({ verifySiret: vi.fn() }));

function request(body: unknown) {
  return new Request("http://localhost/api/artisan/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  email: "artisan@example.com",
  password: "hunter2hunter2",
  siret: "12345678900012",
  corpsMetier: ["plomberie"],
};

describe("POST /api/artisan/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a request missing required fields before ever checking the SIRET", async () => {
    const response = await POST(request({ email: "a@b.com" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(verifySiret).not.toHaveBeenCalled();
  });

  it("rejects a confirmed-bad SIRET without ever calling signUp", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "introuvable" });
    const supabase = createFakeSupabase();
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "siret_invalide" });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("distinguishes a SIRET-service outage from a confirmed-bad SIRET", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "indisponible" });
    const supabase = createFakeSupabase();
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "siret_indisponible" });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("maps a duplicate email to 409 email_taken", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Acme SARL" });
    const supabase = createFakeSupabase({
      signUp: { data: { user: null }, error: { code: "user_already_exists", message: "already registered" } },
    });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "email_taken" });
  });

  it("reports signup_failed (without a claim to fix) when the post-signUp artisans insert fails", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Acme SARL" });
    const supabase = createFakeSupabase({ insertError: { message: "constraint violation" } });
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "signup_failed" });
  });

  it("succeeds end to end for a valid SIRET and a fresh email", async () => {
    vi.mocked(verifySiret).mockResolvedValue({ status: "valide", denomination: "Acme SARL" });
    const supabase = createFakeSupabase();
    vi.mocked(createServerSupabaseClient).mockReturnValue(supabase as never);

    const response = await POST(request(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(supabase.from).toHaveBeenCalledWith("artisans");
  });
});
