import { MAX_CAPACITY, SLOT_MINUTES, type Booking } from './types';

/** Converts "HH:MM" or "HH:MM:SS" to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Converts minutes since midnight to "HH:MM". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** All 30-minute slot start-times (in minutes) covering [start, end). */
export function slotsInRange(startMinutes: number, endMinutes: number): number[] {
  const slots: number[] = [];
  for (let t = startMinutes; t < endMinutes; t += SLOT_MINUTES) {
    slots.push(t);
  }
  return slots;
}

/**
 * Number of children already booked (active) in the slot starting at
 * `slotStart` (minutes since midnight), for the given window's bookings.
 */
export function occupancyForSlot(bookings: Booking[], slotStart: number): number {
  const slotEnd = slotStart + SLOT_MINUTES;
  return bookings
    .filter((b) => b.status === 'active')
    .filter((b) => {
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      return bStart < slotEnd && bEnd > slotStart;
    })
    .reduce((sum, b) => sum + b.children_count, 0);
}

/** Occupancy per 30-min slot across the whole window, keyed by slot start minute. */
export function occupancyByWindow(
  bookings: Booking[],
  windowStartMinutes: number,
  windowEndMinutes: number,
): Map<number, number> {
  const map = new Map<number, number>();
  for (const slot of slotsInRange(windowStartMinutes, windowEndMinutes)) {
    map.set(slot, occupancyForSlot(bookings, slot));
  }
  return map;
}

/**
 * Max children that can still be added across the whole requested range
 * (the minimum free capacity among all 30-min slots in the range).
 * Returns 0 (or negative-safe 0) if the range has no slots.
 */
export function maxAvailableForRange(
  bookings: Booking[],
  rangeStartMinutes: number,
  rangeEndMinutes: number,
): number {
  const slots = slotsInRange(rangeStartMinutes, rangeEndMinutes);
  if (slots.length === 0) return 0;
  let min = MAX_CAPACITY;
  for (const slot of slots) {
    const occupied = occupancyForSlot(bookings, slot);
    const free = MAX_CAPACITY - occupied;
    if (free < min) min = free;
  }
  return Math.max(0, min);
}

export interface CapacityCheckResult {
  ok: boolean;
  /** First slot (HH:MM) that would be over capacity, if any. */
  blockedAt?: string;
}

/**
 * Checks whether `childrenToAdd` children can be booked for
 * [rangeStartMinutes, rangeEndMinutes) without exceeding MAX_CAPACITY in any
 * 30-min slot.
 */
export function canBook(
  bookings: Booking[],
  rangeStartMinutes: number,
  rangeEndMinutes: number,
  childrenToAdd: number,
): CapacityCheckResult {
  for (const slot of slotsInRange(rangeStartMinutes, rangeEndMinutes)) {
    const occupied = occupancyForSlot(bookings, slot);
    if (occupied + childrenToAdd > MAX_CAPACITY) {
      return { ok: false, blockedAt: minutesToTime(slot) };
    }
  }
  return { ok: true };
}

export type SlotColor = 'green' | 'yellow' | 'red';

export function colorForOccupancy(occupied: number): SlotColor {
  if (occupied <= 0) return 'green';
  if (occupied < MAX_CAPACITY) return 'yellow';
  return 'red';
}
