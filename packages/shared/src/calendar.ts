import { z } from 'zod';

export const CalendarTypeSchema = z.enum(['JALALI', 'GREGORIAN']);
export type CalendarType = z.infer<typeof CalendarTypeSchema>;

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  attendeeIds: z.array(z.string()).default([]),
});
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;
