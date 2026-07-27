import { createServiceRoleSupabaseClient } from "@alpha-cil/db";
import { sendMail } from "@alpha-cil/notifications";
import { NextResponse } from "next/server";

interface LogementANotifier {
  logement_id: string;
  proprietaire_email: string;
  chauffage_du: boolean;
  chauffage_echeance: string | null;
  vmc_du: boolean;
  vmc_echeance: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
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
    if (logement.chauffage_du && logement.chauffage_echeance) {
      try {
        await sendMail(
          logement.proprietaire_email,
          "Alpha CIL — entretien à prévoir",
          `<p>L'entretien de votre chauffage arrive à échéance le ${dateFormatter.format(new Date(logement.chauffage_echeance))}.</p>
           <p><a href="${new URL(request.url).origin}/proprietaire/espace">Consultez votre carnet</a> pour mettre à jour la date une fois l'entretien réalisé.</p>`,
        );
        await supabase
          .from("logements")
          .update({ rappel_chauffage_envoye_a: new Date().toISOString() })
          .eq("id", logement.logement_id);
        notifies += 1;
      } catch {
        // A failed send for one logement never blocks the rest of the run.
      }
    }

    if (logement.vmc_du && logement.vmc_echeance) {
      try {
        await sendMail(
          logement.proprietaire_email,
          "Alpha CIL — entretien à prévoir",
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
