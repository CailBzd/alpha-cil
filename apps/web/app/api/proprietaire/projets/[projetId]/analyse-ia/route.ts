import { compareDevis, type DevisPourComparaison } from "@foya/ai";
import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MODELE = "mistral-large-latest";

export async function POST(request: Request, { params }: { params: Promise<{ projetId: string }> }) {
  const { projetId } = await params;

  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Single round trip: checks ownership + the free/paid quota and decides
  // atomically, closing the double-click race a separate check-then-insert
  // from this route would leave open.
  const { data: quotaResult, error: quotaError } = await supabase.rpc("peut_lancer_analyse_ia", {
    p_projet_id: projetId,
  });

  if (quotaError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  const decision = quotaResult?.[0];
  if (!decision?.autorise) {
    const status = decision?.raison === "forbidden" ? 403 : 429;
    return NextResponse.json({ error: decision?.raison ?? "forbidden" }, { status });
  }

  const { data: devisRows } = await supabase
    .from("devis")
    .select("contact_id, montant, conditions, statut, date_devis")
    .eq("projet_id", projetId);

  if (!devisRows || devisRows.length === 0) {
    return NextResponse.json({ error: "aucun_devis" }, { status: 400 });
  }

  const contactIds = devisRows.map((devis) => devis.contact_id);
  const { data: contacts } = await supabase.from("contacts").select("id, nom").in("id", contactIds);
  const nomParContact = new Map((contacts ?? []).map((contact) => [contact.id, contact.nom]));

  const devisPourComparaison: DevisPourComparaison[] = devisRows.map((devis) => ({
    contact: nomParContact.get(devis.contact_id) ?? "Contact inconnu",
    montant: devis.montant,
    conditions: devis.conditions,
    statut: devis.statut,
    dateDevis: devis.date_devis,
  }));

  let contenu: string;
  try {
    contenu = await compareDevis(devisPourComparaison);
  } catch {
    // The quota isn't consumed on an AI-side failure — only a successful
    // analysis is worth counting against the caller's usage.
    return NextResponse.json({ error: "ai_indisponible" }, { status: 502 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("projet_analyses_ia")
    .insert({ projet_id: projetId, contenu, modele: MODELE })
    .select("id, contenu, modele, created_at")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, analyse: inserted });
}
