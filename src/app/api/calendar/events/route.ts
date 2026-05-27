import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CalEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
};

function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function parseIcalDate(val: string): { dateTime?: string; date?: string } {
  // All-day: VALUE=DATE:20260515
  if (/^\d{8}$/.test(val)) {
    return { date: `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}` };
  }
  // UTC: 20260515T100000Z
  if (val.endsWith("Z")) {
    return { dateTime: new Date(val.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")).toISOString() };
  }
  // Local: 20260515T100000
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    return { dateTime: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` };
  }
  return { dateTime: val };
}

function parseIcal(text: string): CalEvent[] {
  const lines = unfold(text).split(/\r?\n/);
  const events: CalEvent[] = [];
  let current: Partial<CalEvent> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT" && current) {
      if (current.id && current.summary !== undefined) {
        events.push(current as CalEvent);
      }
      current = null;
    } else if (current) {
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const key = line.slice(0, colon).toUpperCase();
      const value = line.slice(colon + 1).trim();

      if (key === "UID") current.id = value;
      else if (key === "SUMMARY") current.summary = value.replace(/\\,/g, ",").replace(/\\n/g, " ");
      else if (key === "URL") current.htmlLink = value;
      else if (key.startsWith("DTSTART")) {
        current.start = parseIcalDate(value);
      } else if (key.startsWith("DTEND")) {
        current.end = parseIcalDate(value);
      }
    }
  }

  return events;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL;
  if (!icalUrl) return NextResponse.json({ error: "Calendar not configured" }, { status: 503 });

  const res = await fetch(icalUrl, { next: { revalidate: 300 } });
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 502 });

  const text = await res.text();
  const all = parseIcal(text);

  const now = Date.now();
  const cutoff = now + 14 * 24 * 60 * 60 * 1000;

  const upcoming = all
    .filter((ev) => {
      const raw = ev.start.dateTime ?? ev.start.date;
      if (!raw) return false;
      const t = new Date(raw).getTime();
      return t >= now && t <= cutoff;
    })
    .sort((a, b) => {
      const ta = new Date(a.start.dateTime ?? a.start.date ?? 0).getTime();
      const tb = new Date(b.start.dateTime ?? b.start.date ?? 0).getTime();
      return ta - tb;
    })
    .slice(0, 8);

  return NextResponse.json(upcoming);
}
