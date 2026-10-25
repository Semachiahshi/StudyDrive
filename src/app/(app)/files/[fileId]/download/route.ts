import { NextResponse, type NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth";

/** Redirects to a short-lived signed URL for one of the owner's files. */
export async function GET(request: NextRequest, { params }: RouteContext<"/files/[fileId]/download">) {
  const { fileId } = await params;
  const { supabase } = await requireOwner();

  const { data: file } = await supabase.from("study_files").select("storage_path, display_name").eq("id", fileId).maybeSingle();
  if (!file) return new NextResponse("Soubor nebyl nalezen.", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const { data, error } = await supabase.storage
    .from("study-files")
    .createSignedUrl(file.storage_path, 60, download ? { download: file.display_name } : undefined);
  if (error || !data) return new NextResponse("Soubor se nepodařilo otevřít.", { status: 500 });

  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
