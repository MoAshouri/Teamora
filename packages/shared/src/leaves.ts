import { z } from 'zod';

export const LeaveTypeSchema = z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

export const CreateLeaveRequestSchema = z.object({
  type: LeaveTypeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
});
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;

export const ReviewLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().max(500).optional(),
});
export type ReviewLeaveInput = z.infer<typeof ReviewLeaveSchema>;
