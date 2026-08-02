import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { CarnetDocument } from "@/app/(owner)/proprietaire/espace/export/CarnetDocument";
import { getServerSupabaseClient } from "@/lib/supabase-server";

interface ExportPdfBody {
  interventionIds?: unknown;
  includeAdresse?: unknown;
  confirmed?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ExportPdfBody | null;
  const interventionIds = Array.isArray(body?.interventionIds)
    ? body.interventionIds.filter((id): id is string => typeof id === "string")
    : [];
  const includeAdresse = body?.includeAdresse === true;

  if (interventionIds.length === 0 && !includeAdresse && body?.confirmed !== true) {
    return NextResponse.json({ error: "empty_selection" }, { status: 400 });
  }

  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: logement } = await supabase.from("logements").select("id, adresse").maybeSingle();

  if (!logement) {
    return NextResponse.json({ error: "no_logement" }, { status: 400 });
  }

  // RLS already scopes "interventions" to this owner's logement; the
  // .in() filter on top of that ensures only the caller's own selection is
  // ever included — an id outside the selection or outside this logement
  // is silently excluded either way, never added.
  const { data: interventions } =
    interventionIds.length > 0
      ? await supabase
          .from("interventions")
          .select("id, type_travaux, date_intervention, artisan_siret, rge_verifie, rge_verifie_a")
          .eq("logement_id", logement.id)
          .in("id", interventionIds)
          .order("date_intervention", { ascending: false })
      : { data: [] };

  const pdfBuffer = await renderToBuffer(
    CarnetDocument({
      adresse: includeAdresse ? logement.adresse : null,
      interventions: interventions ?? [],
    }),
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=carnet-foya.pdf",
    },
  });
}
