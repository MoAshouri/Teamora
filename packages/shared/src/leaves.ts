import { z } from 'zod';

export const LeaveTypeSchema = z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

export const LeaveKindSchema = z.enum(['DAILY', 'HOURLY']);
export type LeaveKind = z.infer<typeof LeaveKindSchema>;

export const LeaveGrantSourceSchema = z.enum(['REQUEST', 'BONUS']);
export type LeaveGrantSource = z.infer<typeof LeaveGrantSourceSchema>;

export const CreateLeaveRequestSchema = z
  .object({
    type: LeaveTypeSchema,
    kind: LeaveKindSchema.optional().default('DAILY'),
    hours: z.number().positive().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind !== 'HOURLY') return;
    if (value.hours == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'hours is required for hourly leave',
        path: ['hours'],
      });
    }
    if (value.startDate !== value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'hourly leave must start and end on the same day',
        path: ['endDate'],
      });
    }
  });
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;

export const ReviewLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
});
export type ReviewLeaveInput = z.infer<typeof ReviewLeaveSchema>;

export const CreateBonusLeaveSchema = z
  .object({
    userId: z.string().min(1),
    kind: LeaveKindSchema,
    amount: z.number().positive(),
    note: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    const max = value.kind === 'DAILY' ? 30 : 40;
    if (value.amount > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `amount must be at most ${max}`,
        path: ['amount'],
      });
    }
  });
export type CreateBonusLeaveInput = z.infer<typeof CreateBonusLeaveSchema>;
