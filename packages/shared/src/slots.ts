// Pure slot-availability helpers (no DB calls — those live in the API service).

export interface SlotWindow {
  _id: string;
  label: string;
  start: string; // "HH:mm"
  end:   string; // "HH:mm"
  daysOfWeek: number[]; // 0=Sunday … 6=Saturday
  capacity: number;
  enabled: boolean;
}

export interface PickupSlotConfig {
  enabled: boolean;
  leadTimeMinutes: number;
  horizonDays: number;
  windows: SlotWindow[];
}

export interface AvailableSlot {
  date: string;       // "YYYY-MM-DD"
  windowId: string;
  label: string;
  start: string;
  end: string;
  scheduledAt: string; // ISO — resolved datetime of window start in IST
  remaining: number;
}

/**
 * Given a slot config, today's date, and a capacity-count lookup,
 * return all bookable slot instances within [leadTime … horizon].
 *
 * @param config     store.pickupSlots
 * @param nowMs      Date.now() (injected for testability)
 * @param countFn    (date, windowId) → booked count so far
 */
export const getAvailableSlots = (
  config: PickupSlotConfig,
  nowMs: number,
  countFn: (date: string, windowId: string) => number,
): AvailableSlot[] => {
  if (!config.enabled) return [];

  const slots: AvailableSlot[] = [];
  const leadMs    = config.leadTimeMinutes * 60 * 1000;
  const earliestMs = nowMs + leadMs;

  for (let dayOffset = 0; dayOffset <= config.horizonDays; dayOffset++) {
    const dayMs = nowMs + dayOffset * 86_400_000;
    const dayDate = new Date(dayMs);
    const dow = dayDate.getUTCDay(); // using UTC; adjust for IST if needed in prod
    const yyyy = dayDate.getUTCFullYear();
    const mm   = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
    const dd   = String(dayDate.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    for (const w of config.windows) {
      if (!w.enabled) continue;
      if (!w.daysOfWeek.includes(dow)) continue;

      const [h, m] = w.start.split(':').map(Number) as [number, number];
      // Approximate: treat window start as UTC for now; IST correction applied in API
      const windowStartMs = Date.UTC(yyyy, dayDate.getUTCMonth(), dayDate.getUTCDate(), h, m);
      if (windowStartMs < earliestMs) continue;

      const booked = countFn(dateStr, w._id);
      const remaining = w.capacity - booked;
      if (remaining <= 0) continue;

      slots.push({
        date: dateStr,
        windowId: w._id,
        label: w.label,
        start: w.start,
        end:   w.end,
        scheduledAt: new Date(windowStartMs).toISOString(),
        remaining,
      });
    }
  }

  return slots;
};
