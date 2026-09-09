import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  starred: z.boolean().optional().default(false),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  starred: z.boolean().optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const ListTasksQuerySchema = z.object({
  starred: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((value) => value === 'true' || value === '1'),
  from: z.string().min(1),
  to: z.string().min(1),
});
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
