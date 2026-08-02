import { createServiceRoleSupabaseClient } from "@foya/db";
import { sendMail } from "@foya/notifications";
import { dateFormatter } from "@/lib/formatters";
import { NextResponse } from "next/server";

interface LogementANotifier {
  logement_id: string;
  proprietaire_email: string;
  chauffage_gaz_du: boolean;
  chauffage_gaz_echeance: string | null;
  chauffage_bois_du: boolean;
  chauffage_bois_echeance: string | null;
  vmc_du: boolean;
  vmc_echeance: string | null;
}

// Vercel Cron invokes scheduled routes with GET, not POST (see vercel.json).
// POST stays too, for manual/local triggering the same way every other
// system-facing endpoint in this app is tested.
export async function GET(request: Request) {
  return handleRappelsEntretien(request);
}

export async function POST(request: Request) {
  return handleRappelsEntretien(request);
}

async function handleRappelsEntretien(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.rpc("logements_a_notifier_entretien");

  if (error) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  const logements = (data ?? []) as LogementANotifier[];
  let notifies = 0;

  for (const logement of logements) {
    if (logement.chauffage_gaz_du && logement.chauffage_gaz_echeance) {
      try {
        await sendMail(
          logement.proprietaire_email,
          "Foya — entretien à prévoir",
          `<p>L'entretien de votre chaudière gaz arrive à échéance le ${dateFormatter.format(new Date(logement.chauffage_gaz_echeance))}.</p>
           <p><a href="${new URL(request.url).origin}/proprietaire/espace">Consultez votre carnet</a> pour mettre à jour la date une fois l'entretien réalisé.</p>`,
        );
        await supabase
          .from("logements")
          .update({ rappel_chauffage_gaz_envoye_a: new Date().toISOString() })
          .eq("id", logement.logement_id);
        notifies += 1;
      } catch {
        // A failed send for one logement never blocks the rest of the run.
      }
    }

    if (logement.chauffage_bois_du && logement.chauffage_bois_echeance) {
      try {
        await sendMail(
          logement.proprietaire_email,
          "Foya — entretien à prévoir",
          `<p>Le ramonage de votre chauffage bois arrive à échéance le ${dateFormatter.format(new Date(logement.chauffage_bois_echeance))}.</p>
           <p><a href="${new URL(request.url).origin}/proprietaire/espace">Consultez votre carnet</a> pour mettre à jour la date une fois l'entretien réalisé.</p>`,
        );
        await supabase
          .from("logements")
          .update({ rappel_chauffage_bois_envoye_a: new Date().toISOString() })
          .eq("id", logement.logement_id);
        notifies += 1;
      } catch {
        // Same resilience posture as the gaz reminder above.
      }
    }

    if (logement.vmc_du && logement.vmc_echeance) {
      try {
        await sendMail(
          logement.proprietaire_email,
          "Foya — entretien à prévoir",
          `<p>L'entretien de votre VMC arrive à échéance le ${dateFormatter.format(new Date(logement.vmc_echeance))}.</p>
           <p><a href="${new URL(request.url).origin}/proprietaire/espace">Consultez votre carnet</a> pour mettre à jour la date une fois l'entretien réalisé.</p>`,
        );
        await supabase
          .from("logements")
          .update({ rappel_vmc_envoye_a: new Date().toISOString() })
          .eq("id", logement.logement_id);
        notifies += 1;
      } catch {
        // Same resilience posture as the heating reminder above.
      }
    }
  }

  return NextResponse.json({ notifies });
}
