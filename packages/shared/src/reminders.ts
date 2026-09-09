import { z } from 'zod';

export const ReminderStatusSchema = z.enum(['ACTIVE', 'SNOOZED', 'ACKED', 'DISABLED']);
export type ReminderStatus = z.infer<typeof ReminderStatusSchema>;

export const ReminderTargetKindSchema = z.enum(['TASK', 'NOTE', 'MEETING', 'CUSTOM']);
export type ReminderTargetKind = z.infer<typeof ReminderTargetKindSchema>;

export const CreateReminderSchema = z
  .object({
    targetKind: ReminderTargetKindSchema,
    targetId: z.string().min(1).optional().nullable(),
    title: z.string().min(1).max(200),
    fireAt: z.string().datetime(),
  })
  .superRefine((value, ctx) => {
    if (value.targetKind !== 'CUSTOM' && !value.targetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'targetId is required for this reminder kind',
        path: ['targetId'],
      });
    }
  });
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;

export const ReviewReminderSchema = z
  .object({
    action: z.enum(['ACK', 'DISABLE', 'EXTEND']),
    extendMinutes: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'EXTEND' && value.extendMinutes == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'extendMinutes is required when extending a reminder',
        path: ['extendMinutes'],
      });
    }
  });
export type ReviewReminderInput = z.infer<typeof ReviewReminderSchema>;
