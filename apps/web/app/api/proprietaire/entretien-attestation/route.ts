import { getServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const COLUMN_BY_TYPE = {
  vmc: {
    path: "attestation_entretien_vmc_path",
    uploadedAt: "attestation_entretien_vmc_uploaded_at",
  },
  chauffage_gaz: {
    path: "attestation_entretien_chauffage_gaz_path",
    uploadedAt: "attestation_entretien_chauffage_gaz_uploaded_at",
  },
  chauffage_bois: {
    path: "attestation_entretien_chauffage_bois_path",
    uploadedAt: "attestation_entretien_chauffage_bois_uploaded_at",
  },
} as const;

type EntretienType = keyof typeof COLUMN_BY_TYPE;

function isEntretienType(value: FormDataEntryValue | null): value is EntretienType {
  return typeof value === "string" && value in COLUMN_BY_TYPE;
}

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get("type");
  const attestation = formData.get("attestation");

  if (!isEntretienType(type) || !(attestation instanceof File) || attestation.size === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (attestation.type !== "application/pdf") {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const { data: logement } = await supabase.from("logements").select("id").maybeSingle();

  if (!logement) {
    return NextResponse.json({ error: "no_logement" }, { status: 400 });
  }

  const columns = COLUMN_BY_TYPE[type];
  const attestationPath = `${user.id}/${type}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("entretien-attestations")
    .upload(attestationPath, attestation, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("logements")
    .update({
      [columns.path]: attestationPath,
      [columns.uploadedAt]: new Date().toISOString(),
    })
    .eq("id", logement.id);

  if (updateError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
