import { createServerSupabaseClient } from "@alpha-cil/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  const formData = await request.formData();
  const attestation = formData.get("attestation");

  if (!(attestation instanceof File) || attestation.size === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (attestation.type !== "application/pdf") {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const attestationPath = `${user.id}/decennale.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("artisans")
    .upload(attestationPath, attestation, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("artisans")
    .update({
      attestation_decennale_path: attestationPath,
      attestation_decennale_uploaded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "upload_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
