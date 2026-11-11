export interface BookingInterval {
  starts_at: string;
  ends_at: string;
}

export interface BookingSlot {
  value: string;
  startsAt: string;
  endsAt: string;
  reason: 'past' | 'advisor-busy' | 'candidate-busy' | null;
}

function overlaps(start: number, end: number, interval: BookingInterval) {
  const otherStart = Date.parse(interval.starts_at);
  const otherEnd = Date.parse(interval.ends_at);
  return Number.isFinite(otherStart) && Number.isFinite(otherEnd) && otherStart < otherEnd &&
    start < otherEnd && end > otherStart;
}

/** Hourly slots in the device timezone; no assumed advisor working hours. */
export function buildBookingSlots(
  day: string,
  now: number,
  busy: readonly BookingInterval[],
  bookings: readonly (BookingInterval & { status: string })[],
): BookingSlot[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(now)) return [];
  const [year, month, date] = day.split('-').map(Number);
  const localDay = new Date(`${day}T00:00:00`);
  if (localDay.getFullYear() !== year || localDay.getMonth() !== month - 1 || localDay.getDate() !== date) return [];
  const activeBookings = bookings.filter((booking) => ['PENDING', 'ACCEPTED'].includes(booking.status));
  const slots: BookingSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const value = `${String(hour).padStart(2, '0')}:00`;
    const starts = new Date(`${day}T${value}:00`);
    // DST may normalize a nonexistent wall-clock hour to a later time.
    if (starts.getFullYear() !== year || starts.getMonth() !== month - 1 || starts.getDate() !== date || starts.getHours() !== hour) continue;
    const ends = new Date(starts);
    ends.setHours(hour + 1, 0, 0, 0);
    const start = starts.getTime();
    const end = ends.getTime();
    // A repeated hour can make the next whole wall-clock hour 120 minutes away.
    if (end - start !== 60 * 60_000) continue;
    const reason = start <= now ? 'past'
      : busy.some((interval) => overlaps(start, end, interval)) ? 'advisor-busy'
        : activeBookings.some((interval) => overlaps(start, end, interval)) ? 'candidate-busy'
          : null;
    slots.push({ value, startsAt: starts.toISOString(), endsAt: ends.toISOString(), reason });
  }
  return slots;
}
