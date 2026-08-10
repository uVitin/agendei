import { DateTime } from "luxon";

export interface WorkingBlock {
  startTime: string;
  endTime: string;
}

export interface BusyInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface AvailableSlot {
  startsAt: Date;
  endsAt: Date;
}

export interface CalculateSlotsParams {
  date: string;
  timezone: string;
  durationMinutes: number;
  workingBlocks: WorkingBlock[];
  busyIntervals: BusyInterval[];
  now: Date;
  minimumNoticeMinutes?: number;
}

export function calculateAvailableSlots({
  date,
  timezone,
  durationMinutes,
  workingBlocks,
  busyIntervals,
  now,
  minimumNoticeMinutes = 0,
}: CalculateSlotsParams): AvailableSlot[] {
  if (durationMinutes <= 0) return [];

  const slots: AvailableSlot[] = [];
  const earliestAllowedStart = now.getTime() + minimumNoticeMinutes * 60_000;

  for (const block of workingBlocks) {
    const blockStart = DateTime.fromISO(`${date}T${block.startTime}`, {
      zone: timezone,
    });

    const blockEnd = DateTime.fromISO(`${date}T${block.endTime}`, {
      zone: timezone,
    });

    if (!blockStart.isValid || !blockEnd.isValid) continue;

    let cursor = blockStart;

    while (true) {
      const cursorEnd = cursor.plus({ minutes: durationMinutes });

      if (cursorEnd > blockEnd) break;

      const startsAt = cursor.toUTC().toJSDate();
      const endsAt = cursorEnd.toUTC().toJSDate();

      const isFarEnoughInFuture = startsAt.getTime() >= earliestAllowedStart;

      const isFree = !busyIntervals.some(
        (busy) => startsAt < busy.endsAt && endsAt > busy.startsAt,
      );

      if (isFarEnoughInFuture && isFree) {
        slots.push({ startsAt, endsAt });
      }

      cursor = cursorEnd;
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
