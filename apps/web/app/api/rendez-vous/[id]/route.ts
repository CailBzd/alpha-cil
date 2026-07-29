import { createServerSupabaseClient } from "@alpha-cil/db";
import { sendMail } from "@alpha-cil/notifications";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as
    | { datePrevue?: unknown; statut?: unknown; notes?: unknown }
    | null;

  if (
    !body ||
    (body.statut !== undefined && body.statut !== "provisoire" && body.statut !== "validee")
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      for (const { name, value, options } of cookiesToSet) {
        cookieStore.set(name, value, options);
      }
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS already scopes this select to rows the caller is either the
  // owner or the linked artisan for — a nonexistent or unrelated id
  // simply comes back null.
  const { data: rendezVous } = await supabase
    .from("rendez_vous")
    .select("id, logement_id, artisan_id, artisan_email, logements(adresse, proprietaire_id)")
    .eq("id", id)
    .maybeSingle();

  if (!rendezVous) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const logement = Array.isArray(rendezVous.logements)
    ? rendezVous.logements[0]
    : rendezVous.logements;
  const isArtisan = rendezVous.artisan_id === user.id;
  const isOwner = logement?.proprietaire_id === user.id;

  if (!isArtisan && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    derniere_modification_par: isArtisan ? "artisan" : "proprietaire",
    derniere_modification_a: new Date().toISOString(),
  };
  if (isNonEmptyString(body.datePrevue)) updates.date_prevue = body.datePrevue;
  if (body.statut) updates.statut = body.statut;
  if (typeof body.notes === "string") updates.notes = body.notes;

  const { error: updateError } = await supabase
    .from("rendez_vous")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }

  if (rendezVous.artisan_id) {
    const origin = new URL(request.url).origin;
    const dateLabel = isNonEmptyString(body.datePrevue) ? body.datePrevue : "";
    const html = `<p>Le rendez-vous pour le logement situé au ${logement?.adresse ?? ""} a été mis à jour${dateLabel ? ` (nouvelle date : ${dateLabel})` : ""}.</p>`;

    if (isArtisan) {
      const { data: ownerEmail } = await supabase.rpc("get_rendez_vous_owner_email", {
        p_rendez_vous_id: id,
      });
      if (ownerEmail) {
        await sendMail(
          ownerEmail,
          "Alpha CIL — rendez-vous mis à jour",
          `${html}<p><a href="${origin}/proprietaire/connexion">Connectez-vous</a> pour le consulter.</p>`,
        ).catch(() => {});
      }
    } else if (rendezVous.artisan_email) {
      await sendMail(
        rendezVous.artisan_email,
        "Alpha CIL — rendez-vous mis à jour",
        `${html}<p><a href="${origin}/artisan/connexion">Connectez-vous</a> pour le consulter.</p>`,
      ).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
