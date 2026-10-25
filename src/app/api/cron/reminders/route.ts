import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { configurationStatus, remindersConfigured } from "@/lib/env";
import { runReminderJob } from "@/lib/reminders-job";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Called once a day by Vercel Cron (see vercel.json) with "Authorization: Bearer $CRON_SECRET". */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!remindersConfigured()) {
    const missing = configurationStatus()
      .filter((c) => !c.ok)
      .map((c) => c.name);
    return NextResponse.json({ status: "not_configured", missing }, { status: 503 });
  }

  const result = await runReminderJob();
  return NextResponse.json({ status: "ok", ...result });
}
