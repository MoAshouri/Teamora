import { z } from 'zod';

export const UpsertWorkPolicySchema = z.object({
  workStart: z.string().regex(/^\d{2}:\d{2}$/),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),
  workDays: z.array(z.number().int().min(0).max(6)).min(1),
  timezone: z.string().min(1).default('Asia/Tehran'),
});
export type UpsertWorkPolicyInput = z.infer<typeof UpsertWorkPolicySchema>;

export const SubmitTimeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  note: z.string().max(500).optional(),
});
export type SubmitTimeEntryInput = z.infer<typeof SubmitTimeEntrySchema>;

export const TimeEntryStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type TimeEntryStatus = z.infer<typeof TimeEntryStatusSchema>;
