import { z } from "zod";

/** Aceita apenas HH:MM em 24 horas: 00:00 até 23:59 */
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const blockSchema = z
  .object({
    weekday: z.coerce
      .number()
      .int()
      .min(0, "Dia da semana vai de 0 (domingo) a 6 (sábado)")
      .max(6, "Dia da semana vai de 0 (domingo) a 6 (sábado)"),
    startTime: z.string().regex(timePattern, "Use o formato HH:MM"),
    endTime: z.string().regex(timePattern, "Use o formato HH:MM"),
  })
  .refine((block) => block.endTime > block.startTime, {
    message: "O fim do expediente precisa ser depois do início",
    path: ["endTime"],
  });

export const replaceWorkingHoursSchema = z
  .object({
    blocks: z.array(blockSchema).max(21, "Máximo de 21 blocos por semana"),
  })
  .superRefine((data, ctx) => {
    const seenByWeekday = new Map<
      number,
      { startTime: string; endTime: string }[]
    >();

    data.blocks.forEach((block, index) => {
      const sameDay = seenByWeekday.get(block.weekday) ?? [];

      const overlaps = sameDay.some(
        (other) =>
          block.startTime < other.endTime && block.endTime > other.startTime,
      );

      if (overlaps) {
        ctx.addIssue({
          code: "custom",
          message: "Existem blocos de expediente sobrepostos neste dia",
          path: ["blocks", index],
        });
      }

      sameDay.push(block);
      seenByWeekday.set(block.weekday, sameDay);
    });
  });

export type ReplaceWorkingHoursInput = z.infer<
  typeof replaceWorkingHoursSchema
>;
