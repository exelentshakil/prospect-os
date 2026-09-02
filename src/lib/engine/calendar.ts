import { isMissingTable, supabase } from "../supabase";

export interface Slot {
  start: string;
  label: string;
  taken: boolean;
}

export interface Booking {
  domain: string;
  company: string;
  contact: string;
  slot: string;
  agenda: string[];
  createdAt: string;
}

const globalState = globalThis as unknown as { __calls?: Booking[] };
const bookings: Booking[] = globalState.__calls ?? [];
globalState.__calls = bookings;

export function slots(from = new Date()): Slot[] {
  const out: Slot[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (out.length < 8) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 0 || day === 6) continue;
    for (const hour of [10, 14]) {
      const start = new Date(cursor);
      start.setHours(hour, 0, 0, 0);
      const iso = start.toISOString();
      out.push({
        start: iso,
        label: start.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) +
          ` · ${hour}:00`,
        taken: bookings.some((b) => b.slot === iso),
      });
    }
  }
  return out;
}

export async function book(booking: Booking): Promise<Booking> {
  bookings.unshift(booking);
  const db = supabase();
  if (db) {
    const { error } = await db.from("calls").insert({
      domain: booking.domain,
      company: booking.company,
      contact: booking.contact,
      slot_start: booking.slot,
      agenda: booking.agenda,
      created_at: booking.createdAt,
    });
    if (error && !isMissingTable(error)) {
      // A live-table error is worth surfacing in logs, never to the visitor.
      console.error("calls insert failed", error.message);
    }
  }
  return booking;
}

export function listBookings(): Booking[] {
  return bookings;
}
